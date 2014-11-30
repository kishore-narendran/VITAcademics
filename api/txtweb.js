/*
 *  VITacademics
 *  Copyright (C) 2014  Aneesh Neelam <neelam.aneesh@gmail.com>
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

var path = require('path');

var log;
if (process.env.LOGENTRIES_TOKEN) {
    var logentries = require('node-logentries');
    log = logentries.logger({
                                token: process.env.LOGENTRIES_TOKEN
                            });
}

var errors = require(path.join(__dirname, 'error'));
var chennai_login = require(path.join(__dirname, 'chennai', 'login', 'auto'));
var chennai_mongo = require(path.join(__dirname, 'chennai', 'db', 'mongo'));
var chennai_aggregate = require(path.join(__dirname, 'chennai', 'scraper', 'aggregate'));
var vellore_login = require(path.join(__dirname, 'vellore', 'login', 'auto'));
var vellore_mongo = require(path.join(__dirname, 'vellore', 'db', 'mongo'));
var vellore_aggregate = require(path.join(__dirname, 'vellore', 'scraper', 'aggregate'));


var parseMessage = function (message, mobile, callback) {
    callback(false, ['Feature Incomplete', 'Contribute to aneesh-neelam/VITacademics on GitHub']);
};

module.exports.parseMessage = parseMessage;
