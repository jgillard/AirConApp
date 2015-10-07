'use strict';

module.exports.pushQuerySuccess = function(results, callback) {
    var moment = require('cloud/moment-timezone-with-data-2010-2020.js');
    var today = moment().startOf('day');

    // Go through each entry in the Parse Pushes database
    var users = {};
    var header = ['pushScheduled', 'pushTriggered', 'pushAcknowledged'];
    for (var i = 0; i < results.length; i++) {
        var entry = results[i];
        var user = entry.get('user');
        var userId = user.id;

        // Extract all user IDs
        if ( !(user.id in users) ) {
            users[user.id] = {
                username: user.username,
                pushScheduled: today._d,
                pushTriggered: today._d,
                pushAcknowledged: today._d
            };
        }

        // Add latest time for each header column to each user
        for (var j = 0; j < header.length; j++) {
            var column = header[j];
            var entryTime = entry.get(column);
            var locStr = entry.get('locStr');
            var loc = entry.get('location');
            if (entryTime) {
                var userTime = users[userId][column];
                if (entryTime > userTime) {
                    users[userId][column] = entryTime;
                    // Save location attached to latest pushScheduled
                    if (column === 'pushScheduled') {
                        users[userId]['locStr'] = locStr;
                        users[userId]['loc'] = loc;
                    }
                }
            }
        }
    }
    console.log(users);

    // Process latest times for each user
    var userKeys = Object.keys(users);
    for (var i = 0; i < userKeys.length; i++) {
        var userKey = userKeys[i];

        // If latest pushScheduled newer than latest pushAcknowledged
        // ie. not responded to - should usually be negative
        var deltaAck = users[userKey].pushScheduled - users[userKey].pushAcknowledged;
        // And pushScheduled age greater than 10 minutes
        var deltaNow = moment() - users[userKey].pushScheduled;
        // And pushScheduled was today
        var sameDay = users[userKey].pushScheduled - today;
        sameDay = (sameDay > 0) ? true : false;

        console.log('userId: ' + userKey + ', dAck: ' + deltaAck + ', dNow: ' + deltaNow + ', sameDay: ' + sameDay);
        if (deltaAck > 0 && deltaNow > 900000 && sameDay) {
            var params = {userId: userKey, alarm: false, locStr: users[userKey].locStr, loc: users[userKey].loc, message:
                'AirCon Lone Worker App: Please press RESET in the next 5 minutes.'};
            Parse.Cloud.run('sendSMS', params, {
                success: function(response) {
                    status.success('User Monitor completed successfully.');
                },
                error: function(error) {
                    console.log(error);
                    status.error('Uh oh, something went wrong.');
                }
            });
        }
        if (deltaAck > 0 && deltaNow > 1200000 && sameDay) {
            var ackString = moment(users[userKey].pushAcknowledged).tz('Europe/London').format('ddd DD-MM-YY HH:mm:ss');
            var schedString = moment(users[userKey].pushScheduled).tz('Europe/London').format('ddd DD-MM-YY HH:mm:ss');
            var params = {userId: userKey, alarm: true, locStr: users[userKey].locStr, loc: users[userKey].loc, message:
                'AirConApp: lastAck: ' + ackString + ', lastSched: ' + schedString };
            Parse.Cloud.run('sendSMS', params, {
                success: function(response) {
                    status.success('User Monitor completed successfully.');
                },
                error: function(error) {
                    console.log(error);
                    status.error('Uh oh, something went wrong.');
                }
            });
        }
    }
    if (true) {
        callback.success('pushQuerySuccess success');
    } else {
        callback.error('pushQuerySuccess error');
    }
};


module.exports.pushQueryFailure = function(object, error) {
    console.log('QUERY.FIND ERROR');
    console.log(error);
    if (true) {
        callback.success('pushQueryFailure success');
    } else {
        callback.error('pushQueryFailure error');
    }
};