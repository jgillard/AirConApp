'use strict';

Parse.Cloud.job('userMonitor', function(request, status) {
    var queryCallbacks = require('cloud/queryCallbacks.js');
    var moment = require('cloud/moment-timezone-with-data-2010-2020.js');
    var today = moment().startOf('day');

    // Get all of today's pushes
    var Pushes = Parse.Object.extend('Pushes');
    var query = new Parse.Query(Pushes);
    query.greaterThanOrEqualTo('createdAt', today.toDate());
    query.find({
        success: function(results) {
            queryCallbacks.pushQuerySuccess(results, {
                success: function() {
                    //response.success();
                },
                error: function(error) {
                    //response.error(error);
                }
            });
        },
        error: function(error) {
            queryCallbacks.pushQueryFailure(error, {
                success: function() {
                    //response.success();
                },
                error: function(error) {
                    //response.error(error);
                }
            });
        }
    }).then(function() {
        status.success('User Monitor completed successfully.');
    }, function(error) {
        console.log(error);
        status.error('User Monitor failed spectacularly!');
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
                var message = request.params.message;
                var message2;

                var lat = request.params.loc.lat;
                var long = request.params.loc.long;
                var gmapsURL = 'http://maps.google.com/maps?q=loc:' + lat + '+' + long;

                if (request.params.alarm === true) {
                    phonenumber = '+447809146848';
                    message2 = ', User: ' + user[0].get('username') + ', Loc: ' + request.params.locStr + ', Link: ' + gmapsURL;
                } else {
                    phonenumber = user[0].get('phonenumber');
                }
                // Check whether an SMS already sent today
                var today = moment().startOf('day');
                var SMS = Parse.Object.extend('SMS');
                var query = new Parse.Query(SMS);
                query.equalTo('to', phonenumber);
                query.greaterThanOrEqualTo('createdAt', today.toDate());
                query.find({
                    success: function(result) {
                        if (result.length === 0) {
                            if (request.params.alarm === true) console.log('ALERT! SMS function called for the boss man');
                            else console.log('WARNING! SMS function called for ' + user[0].get('username'));
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
                            if (message2) {
                                client.sendSms({
                                    to: phonenumber,
                                    from: '+441613751791',
                                    body: message2
                                });
                            }
                        } else {
                            response.success('Already sent an SMS today');
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