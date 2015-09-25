angular.module('app.core')

.factory('ParseService', function($localStorage, LocationService, DebugService) {
    'use strict';

    var o = {};

    o.savePush = function(key, value) {
        var user = Parse.User.current();
        var Push = Parse.Object.extend('Pushes');
        var push = new Push();
        push.set(key, value);
        push.set('user', user);
        LocationService.getCurrentPosition().then(function(posData) {
            var location = {lat: posData.latitude, long: posData.longitude, acc: posData.accuracy};
            push.set('location', location);
            push.save(null, {
                success: function(push) {
                    console.log('DATA SAVED TO PARSE: ' + key);
                    navigator.vibrate([20,50,20]);
                },
                error: function(push, error) {
                    console.error(error, push);
                    if (error.code === 100) {
                        $localStorage.parseQueue.push(push);
                        navigator.vibrate([250,100,50]);
                    } else {
                        DebugService.emailDev(JSON.stringify(push) + JSON.stringify(error),
                            'parse.service:savePush:save');
                    }
                }
            });
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