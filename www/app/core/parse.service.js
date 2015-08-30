angular.module('app.core')

.factory('ParseService', function($localStorage, LocationService, DebugService) {
    'use strict';

    var o = {};

    o.savePush = function(key, value) {
        var user = Parse.User.current();
        var Status = Parse.Object.extend('Pushes');
        var status = new Status();
        status.set(key, value);
        status.set('user', user);
        var posData = LocationService.posData;
        var location = {lat: posData.latitude, long: posData.longitude, acc: posData.accuracy};
        status.set('location', location);
        status.save(null, {
            success: function(status) {
                console.log('DATA SAVED TO PARSE: ' + key);
                navigator.vibrate([20,50,20]);
            },
            error: function(status, error) {
                console.error(error, status);
                if (error.code === 100) {
                    $localStorage.parseQueue.push(status);
                    navigator.vibrate([250,100,50]);
                } else {
                    DebugService.emailDev(JSON.stringify(status) + JSON.stringify(error),
                        'parse.service:savePush:save');
                }
            }
        });
    };

    o.retrySave = function(data) {
        data.save(null, {
            success: function(push) {
                console.log('DATA SAVED TO PARSE: retrySave');
                navigator.vibrate([200,50,200]);
            },
            error: function(push, error) {
                console.error(error, push);
                if (error.code === 100) {
                    $localStorage.parseQueue.push(push);
                    navigator.vibrate([250,100,50]);
                } else {
                    DebugService.emailDev(JSON.stringify(status) + JSON.stringify(error),
                        'parse.service:savePush:save');
                }
            }
        });
    };

    return o;
});