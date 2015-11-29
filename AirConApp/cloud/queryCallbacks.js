'use strict';

var moment = require('cloud/moment-timezone-with-data-2010-2020.js');

module.exports.pushQuerySuccess = function(results) {

    // Create users array which contains latest push times and other info for all users from today
    var users = assembleUsers(results);
    console.log(users);

    // Analyse each user's push timings, act if requirements met
    processUsers(users);

};


var assembleUsers = function(results) {
    var today = moment().startOf('day');

    // Go through each entry in the Parse Pushes database
    var users = {};
    var ackRow = 0;

    for (var i = 0; i < results.length; i++) {
        var entry = results[i];
        var user = entry.get('user');
        var userId = user.id;

        // Extract all user IDs
        if ( !(user.id in users) ) {
            users[user.id] = {
                username: user.username,
                pushScheduled: today._d,
                pushAcknowledged: today._d
            };
        }

        // Add latest pushAcknowledged for each user
        var entryTime = entry.get('pushAcknowledged');
        if (entryTime) {
            if (entryTime > users[userId]['pushAcknowledged']) {
                users[userId]['pushAcknowledged'] = entryTime;
                ackRow = i;
                users[userId]['locStr'] = entry.get('locStr');
                users[userId]['loc'] = entry.get('location');
            }
        }
    }

    for (var user in users) {
        // Find next Sched after Ack
        var now = moment();
        var nextSched = now;
        for (var i = 0; i < results.length; i++) {
            if (results[i].get('user').id === user) {
                var entryTime = results[i].get('pushScheduled');
                if (entryTime) {
                    if (entryTime - users[user].pushAcknowledged < nextSched - users[user].pushAcknowledged &&
                        entryTime - users[user].pushAcknowledged > 0) {
                        nextSched = entryTime;
                        users[user]['locStr'] = results[i].get('locStr');
                        users[user]['loc'] = results[i].get('location');
                    }
                }
            }
        }
        // If no newer Sched, find previous
        if (nextSched === now) {
            for (var i = 0; i < results.length; i++) {
                if (results[i].get('user').id === user) {
                    var entryTime = results[i].get('pushScheduled');
                    if (entryTime && nextSched === now) {
                        nextSched = entryTime;
                    }
                    if (entryTime) {
                        if (users[user].pushAcknowledged - entryTime < users[user].pushAcknowledged - nextSched) {
                            nextSched = entryTime;
                        }
                    }
                }
            }
        }
        users[user].pushScheduled = nextSched;
    }
    return users;
};


var processUsers = function(users) {
    var today = moment().startOf('day');

    // Process latest times for each user
    var userKeys = Object.keys(users);
    for (var i = 0; i < userKeys.length; i++) {
        var userKey = userKeys[i];
        users[userKey]['userId'] = userKey;
        var user = users[userKey];

        // If latest pushScheduled newer than latest pushAcknowledged
        // ie. not responded to - should usually be negative
        var deltaAck = user.pushScheduled - user.pushAcknowledged;
        // And pushScheduled age greater than 10 minutes
        var deltaNow = moment() - user.pushScheduled;
        // And pushScheduled was today
        var sameDay = (user.pushScheduled - today) > 0;

        console.log('userId: ' + userKey + ', dAck: ' + deltaAck + ', dNow: ' + deltaNow + ', sameDay: ' + sameDay);

        // Check if requirements for SMS to user met
        if (deltaAck > 0 && deltaNow > (31*60*1000) && sameDay) {
            sendSMS(user, {alarm: false});
        }

        // Check if requirements for HQ to user met
        if (deltaAck > 0 && deltaNow > (35*60*1000) && sameDay) {
            sendSMS(user, {alarm: true});
        }
    }
};


var sendSMS = function(userArr, params) {

    Parse.Config.get().then(function(config) {

        var twilio = require('twilio')(config.get('TWILIO_ACCOUNT_SID'),
                                       config.get('TWILIO_AUTH_TOKEN'));

        var query = new Parse.Query(Parse.User);
        query.equalTo('objectId', userArr.userId);

        query.find({
            success: function(user) {
                var phonenumber;
                var message;

                var lat = userArr.loc.lat;
                var long = userArr.loc.long;
                var gmapsURL = 'http://maps.google.com/maps?q=loc:' + lat + '+' + long;

                if (params.alarm === true) {
                    phonenumber = '+447809146848';
                    message = 'AirConApp. 35 minute alert. User: ' + user[0].get('username') + ', Loc: ' + userArr.locStr + ', Link: ' + gmapsURL;
                } else {
                    phonenumber = user[0].get('phonenumber');
                    message = 'AirCon Lone Worker App: Please press RESET in the next 4 minutes.';
                }

                // Check whether an SMS already sent today
                var today = moment().startOf('day');
                var SMS = Parse.Object.extend('SMS');
                var query = new Parse.Query(SMS);
                query.equalTo('to', phonenumber);
                query.greaterThanOrEqualTo('createdAt', today.toDate());
                query.find({
                    success: function(result) {
                        // If SMS not already sent
                        if (result.length === 0) {
                            twilio.sendSms({
                                to: phonenumber,
                                from: '+441613751791',
                                body: message
                            },
                            function(err, responseData) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    // Add entry to SMS sent table
                                    var SMS = Parse.Object.extend('SMS');
                                    var sms = new SMS();
                                    sms.set('to', phonenumber);
                                    sms.set('message', message);
                                    sms.save(null, {
                                        success: function(sms) { },
                                        error: function(sms, error) {
                                            console.log(error);
                                            console.log('Failed to create new object, with error code: ' + error.message);
                                        }
                                    });
                                }
                                if (params.alarm === true) {
                                    console.log('ALERT! SMS sent to HQ for ' + user[0].get('username'));
                                } else {
                                    console.log('WARNING! SMS sent to ' + user[0].get('username'));
                                }
                            });
                        } else {
                            console.log('Already sent an SMS today');
                        }
                    },
                    error: function(error) {
                        console('WTF asre we down herez');
                        console.log(error.code + error.message);
                    }
                });
            }, error: function(error) {
                console('WTF asre we down here');
                console.log(error.code + error.message);
            }
        });
    });
};