'use strict';

Parse.Cloud.job('userMonitor', function(request, status) {
    var moment = require('moment');

    var now = moment();
    var today = now.startOf('day');

    // Get all of today's pushes
    var Pushes = Parse.Object.extend('Pushes');
    var query = new Parse.Query(Pushes);
    query.greaterThanOrEqualTo('createdAt', today.toDate());
    query.find({
        success: function(results) {

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
                        pushScheduled: now,
                        pushTriggered: now,
                        pushAcknowledged: now
                    };
                }

                // Add latest time for each header column to each user
                for (var j = 0; j < header.length; j++) {
                    var column = header[j];
                    var entryTime = entry.get(column);
                    if (entryTime) {
                        var userTime = users[userId][column]['_d'];
                        if (entryTime > userTime) {
                            users[userId][column] = entryTime;
                        }
                    }
                }
            }
            console.log('USERS');
            console.log(users);

            // Process latest times for each user
            var userKeys = Object.keys(users);
            for (var i = 0; i < userKeys.length; i++) {
                var userKey = userKeys[i];

                // If latest pushScheduled newer than latest pushAcknowledged
                // ie. not responded to - should usually be negative
                var deltaAck = users[userKey].pushScheduled - users[userKey].pushAcknowledged;
                // And pushTriggered age greater than 10 minutes
                var deltaNow = moment() - users[userKey].pushTriggered;

                console.log('userId: ' + userKey + ', dAck: ' + deltaAck + ', dNow: ' + deltaNow);
                if (deltaAck > 0 && deltaNow > 600000) {
                    console.log('WARNING! SMS function called for ' + userKey);
                    var params = {userId: userKey, alarm: false, message:
                        'AirConApp: You missed a push. Please press RESET in the next 10 minutes.'};
                    Parse.Cloud.run('sendSMS', params, {
                        success: function(response) {
                            console.log(response);
                            status.success('User Monitor completed successfully.');
                        },
                        error: function(error) {
                            console.log(error);
                            status.error('Uh oh, something went wrong.');
                        }
                    });
                }
                if (deltaAck > 0 && deltaNow > 1200000) {
                    console.log('ALERT! SMS function called for the boss man');
                    var params = {userId: userKey, alarm: true, message:
                        'AirConApp: lastAck: ' + users[userKey].pushAcknowledged.toGMTString() +
                                ', lastSched: ' + users[userKey].pushScheduled.toGMTString() };
                    Parse.Cloud.run('sendSMS', params, {
                        success: function(response) {
                            console.log(response);
                            status.success('User Monitor completed successfully.');
                        },
                        error: function(error) {
                            console.log(error);
                            status.error('Uh oh, something went wrong.');
                        }
                    });
                }
            }
        },
        error: function(object, error) {
            console.log('QUERY.FIND ERROR');
            console.log(error);
        }
    }).then(function() {
        status.success('User Monitor completed successfully.');
    }, function(error) {
        console.log(error);
        status.error('Uh oh, something went wrong.');
    });
});



Parse.Cloud.define('sendSMS', function(request, response) {
    var moment = require('moment');

    Parse.Config.get().then(function(config) {

        var client = require('twilio')(config.get('TWILIO_ACCOUNT_SID'),
                                       config.get('TWILIO_AUTH_TOKEN'));

        var query = new Parse.Query(Parse.User);
        query.equalTo('objectId', request.params.userId);
        query.find({
            success: function(user) {
                var phonenumber;
                var message;
                if (request.params.alarm === true) {
                    phonenumber = '+447809146848';
                    console.log(user[0].get('username'));
                    message = request.params.message + ', User: ' + user[0].get('username');
                } else {
                    phonenumber = user[0].get('phonenumber');
                    message = request.params.message;
                }
                // Check whether an SMS already sent today
                var today = moment().startOf('day');
                var SMS = Parse.Object.extend('SMS');
                var query = new Parse.Query(SMS);
                query.equalTo('to', phonenumber);
                query.greaterThanOrEqualTo('createdAt', today.toDate());
                query.find({
                    success: function(result) {
                        console.log(result);
                        if (result.length === 0) {
                            client.sendSms({
                                to: phonenumber,
                                from: '+441613751791',
                                body: message
                            },
                            function(err, responseData) {
                                if (err) {
                                    console.log(err);
                                    response.error(err);
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
                                            alert('Failed to create new object, with error code: ' + error.message);
                                        }
                                    });

                                    response.success(responseData);
                                }
                            });
                        } else {
                            console.log('Already sent an SMS today');
                        }
                    },
                    error: function(object, error) {
                        console.log(error);
                    }
                });
            }
        });
    });
});



Parse.Cloud.define('pySendSMS', function(request, response) {

    Parse.Config.get().then(function(config) {

        var client = require('twilio')(config.get('TWILIO_ACCOUNT_SID'),
                                       config.get('TWILIO_AUTH_TOKEN'));

        client.sendSms({
            to: request.params.to,
            from: '+441613751791',
            body: request.params.message
        }, function(err, responseData) {
            if (err) {
                console.log(err);
                response.error(err);
            } else {
                response.success(responseData);
            }
        });
    });
});