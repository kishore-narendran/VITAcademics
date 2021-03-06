/*
 *  VITacademics
 *  Copyright (C) 2015  Aneesh Neelam <neelam.aneesh@gmail.com>
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

var express = require('express');
var path = require('path');

var api_txtweb = require(path.join(__dirname, '..', 'api', 'txtweb'));

var router = express.Router();

router.get('/', function (req, res) {
  let googleAnalyticsToken = process.env.GOOGLE_ANALYTICS_TOKEN || 'UA-35429946-2';
  let txtWebAppKey = process.env.TXTWEB_APP_KEY || 'randomkey';
  if (req.query['txtweb-message'] && req.query['txtweb-mobile']) {
    let args = req.query['txtweb-message'].toUpperCase().split(' ');
    let app = {
      dbs: req.dbs,
      queue: req.queue
    };
    let data = {
      args: args,
      mobile: req.query['txtweb-mobile']
    };
    let onGet = function (err, messages) {
      res.render('txtweb', {
        googleAnalyticsToken: googleAnalyticsToken,
        messages: messages,
        instructions: false,
        txtWebAppKey: txtWebAppKey
      });
    };
    api_txtweb.parseMessage(app, data, onGet);
  }
  else {
    let messages = [
      'Register with the VITacademics SMS Service: @vitacademics register [Campus] [RegNo] [DoB]',
      'Get Course Details:  @vitacademics course [CourseCode]',
      'Get Today\'s Classes: @vitacademics today',
      'Get Attendance: @vitacademics attendance',
      'Get Marks: @vitacademics marks',
      'Help - @vitacademics help'
    ];
    res.render('txtweb', {
      googleAnalyticsToken: googleAnalyticsToken,
      messages: messages,
      instructions: true,
      txtWebAppKey: txtWebAppKey
    });
  }
});

module.exports = router;
