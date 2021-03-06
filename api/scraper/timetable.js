/*
 *  VITacademics
 *  Copyright (C) 2015  Aneesh Neelam <neelam.aneesh@gmail.com>
 *  Copyright (C) 2015  Saurabh Joshi <battlex94@gmail.com>
 *  Copyright (C) 2015  Ayush Agarwal <agarwalayush161@gmail.com>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

var cache = require('memory-cache');
var cheerio = require('cheerio');
var moment = require('moment');
var momentTimezone = require('moment-timezone');
var path = require('path');
var unirest = require('unirest');

var status = require(path.join(__dirname, '..', '..', 'status'));


exports.scrapeTimetable = function (app, data, callback) {
  let timetableUri;
  if (data.campus === 'vellore') {
    timetableUri = 'https://academics.vit.ac.in/parent/timetable.asp?sem=' + data.semester;
  }
  else if (data.campus === 'chennai') {
    timetableUri = 'http://27.251.102.132/parent/timetable.asp?sem=' + data.semester;
  }
  var CookieJar = unirest.jar();
  let cookieSerial = cache.get(data.reg_no).cookie;
  var onRequest = function (response) {
    if (response.error) {
      data.status = status.vitDown;
      callback(true, data);
    }
    else {
      var timetable = {
        courses: [],
        withdrawn_courses: [],
        timings: []
      };
      try {
        var baseScraper = cheerio.load(response.body);
        var timetableScraper;
        var withdrawnScraper;
        var coursesScraper;
        if (baseScraper('b').eq(1).text().substring(0, 2) === 'No') {
          coursesScraper = null;
          withdrawnScraper = null;
          timetableScraper = null;
        }
        else if (baseScraper('table table').length == 3) {
          coursesScraper = cheerio.load(baseScraper('table table').eq(0).html());
          withdrawnScraper = cheerio.load(baseScraper('table table').eq(1).html());
          timetableScraper = cheerio.load(baseScraper('table table').eq(2).html());
        }
        else if (baseScraper('table table').length == 2) {
          coursesScraper = cheerio.load(baseScraper('table table').eq(0).html());
          withdrawnScraper = null;
          timetableScraper = cheerio.load(baseScraper('table table').eq(1).html());
        }
        var tmp = {};
        var slotTimings = {
          theory: {},
          lab: {}
        };
        if (coursesScraper) {
          let length = coursesScraper('tr').length;
          var onEachCourse = function (i, elem) {
            if (i > 0 && i < (length - 1)) {
              var htmlColumn = cheerio.load(coursesScraper(this).html())('td');
              let classnbr = parseInt(htmlColumn.eq(1).text());
              let code = htmlColumn.eq(2).text();
              let courseType = htmlColumn.eq(4).text();
              let columns = htmlColumn.length;
              let slot = null;
              let venue = null;
              let faculty = null;
              let registrationStatus = null;
              let bill;
              let billDate = null;
              let billNumber = null;
              let projectTitle = null;
              if (columns === 13) {
                slot = htmlColumn.eq(8).text();
                venue = htmlColumn.eq(9).text();
                faculty = htmlColumn.eq(10).text();
                registrationStatus = htmlColumn.eq(11).text();
                bill = htmlColumn.eq(12).text().split(' / ');
                billDate = moment(bill[1], 'DD/MM/YYYY').isValid() ? moment(bill[1], 'DD/MM/YYYY').format('YYYY-MM-DD') : null;
                billNumber = parseInt(bill[0]);
              }
              else if (columns === 12) {
                projectTitle = htmlColumn.eq(8).text().split(':')[1];
                faculty = htmlColumn.eq(9).text().split(':')[1];
                registrationStatus = htmlColumn.eq(10).text();
                bill = htmlColumn.eq(11).text().split(' / ');
                billDate = moment(bill[1], 'DD/MM/YYYY').isValid() ? moment(bill[1], 'DD/MM/YYYY').format('YYYY-MM-DD') : null;
                billNumber = parseInt(bill[0]);
              }
              if (courseType == 'Embedded Theory') {
                code = code + 'ETH';
              }
              else if (courseType == 'Embedded Lab') {
                code = code + 'ELA';
              }
              else if (courseType == 'Theory Only') {
                code = code + 'TH';
              }
              else if (courseType == 'Lab Only') {
                code = code + 'LO';
              }
              tmp[code] = classnbr;
              timetable['courses'].push({
                class_number: classnbr,
                course_code: htmlColumn.eq(2).text(),
                course_title: htmlColumn.eq(3).text(),
                subject_type: courseType,
                ltpc: htmlColumn.eq(5).text().replace(/[^a-zA-Z0-9]/g, ''),
                course_mode: htmlColumn.eq(6).text(),
                course_option: htmlColumn.eq(7).text(),
                slot: slot,
                venue: venue,
                faculty: faculty,
                registration_status: registrationStatus,
                bill_date: billDate,
                bill_number: billNumber,
                project_title: projectTitle
              });
            }
          };
          coursesScraper('tr').each(onEachCourse);
        }
        if (withdrawnScraper) {
          let length = withdrawnScraper('tr').length;
          var onEachWithdrawn = function (i, elem) {
            if (i > 0 && i < length) {
              var htmlColumn = cheerio.load(withdrawnScraper(this).html())('td');
              timetable['withdrawn_courses'].push({
                class_number: parseInt(htmlColumn.eq(1).text()),
                course_code: htmlColumn.eq(2).text(),
                course_title: htmlColumn.eq(3).text(),
                subject_type: htmlColumn.eq(4).text(),
                ltpc: htmlColumn.eq(5).text().replace(/[^a-zA-Z0-9]/g, ''),
                course_mode: htmlColumn.eq(6).text()
              });
            }
          };
          withdrawnScraper('tr').each(onEachWithdrawn);
        }
        if (timetableScraper) {
          var onEachRow = function (i, elem) {
            var htmlRow = cheerio.load(timetableScraper(this).html());
            var htmlColumn = htmlRow('td');
            let length = htmlColumn.length;
            if (i <= 1) {
              for (let elt = 1; elt < length; elt++) {
                let col = elt;
                if (!(elt === 7 && i === 0)) {
                  if (i === 0 && elt > 7) {
                    col = col - 1;
                  }
                  momentTimezone.tz.setDefault("Asia/Kolkata");
                  let text = htmlColumn.eq(elt).text();
                  let times = text.split('to');
                  let startTime = moment(times[0], 'hh:mm A').isValid() ? momentTimezone.tz(times[0], 'hh:mm A', "Asia/Kolkata").utc().format('HH:mm:ss') + 'Z' : null;
                  let endTime = moment(times[1], 'hh:mm A').isValid() ? momentTimezone.tz(times[1], 'hh:mm A', "Asia/Kolkata").utc().format('HH:mm:ss') + 'Z' : null;
                  let slotType = i === 0 ? 'theory' : 'lab';
                  slotTimings[slotType][col] = {
                    start_time: startTime,
                    end_time: endTime
                  };
                }
              }
            }
            if (i > 1) {
              let last = null;
              for (let elt = 1; elt < length; elt++) {
                let text = htmlColumn.eq(elt).text().split(' ');
                let sub = text[0] + text[2];
                if (tmp[sub]) {
                  let slotType = (text[2] === 'TH' || text[2] === 'ETH') ? 'theory' : 'lab';
                  if (last) {
                    if (last.class_number === tmp[sub] && last.day === (i - 2)) {
                      last.end_time = slotTimings[slotType][elt].end_time ? slotTimings[slotType][elt].end_time : slotTimings['lab'][elt].end_time;
                    }
                    else {
                      timetable.timings.push(last);
                      last = {
                        class_number: tmp[sub],
                        day: i - 2,
                        start_time: slotTimings[slotType][elt].start_time,
                        end_time: slotTimings[slotType][elt].end_time
                      };
                    }
                  }
                  else {
                    last = {
                      class_number: tmp[sub],
                      day: i - 2,
                      start_time: slotTimings[slotType][elt].start_time,
                      end_time: slotTimings[slotType][elt].end_time
                    };
                  }
                }
                else {
                  if (last) {
                    timetable.timings.push(last);
                    last = null;
                  }
                }
              }
            }
          };
          timetableScraper('tr').each(onEachRow);
        }
        timetable.status = status.success;
        callback(null, timetable);
      }
      catch (ex) {
        data.status = status.dataParsing;
        callback(true, data);
      }
    }
  };
  CookieJar.add(unirest.cookie(cookieSerial), timetableUri);
  unirest.post(timetableUri)
    .jar(CookieJar)
    .timeout(28000)
    .end(onRequest);
};
