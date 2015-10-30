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
        var location = { lat: LocationService.posData.latitude,
                         long: LocationService.posData.longitude,
                         acc: LocationService.posData.accuracy
        };
        push.set('location', location);
        push.set('locStr', LocationService.locStr);
        push.set('appVer', DebugService.appVersion);
        o.save(push, key);
    };

    o.retrySave = function(data) {
        o.save(data, 'unknown');
    };

    o.save = function(push, key) {
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
    };

    return o;
});