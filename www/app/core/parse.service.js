angular.module('app.core')

.factory('ParseService', function(LocationService) {
    'use strict';

    var o = {};

    o.savePush = function(key, value) {
        var user = Parse.User.current();
        var Status = Parse.Object.extend('Pushes');
        var status = new Status();
        status.set(key, value);
        status.set('user', user);
        LocationService.getCurrentPosition().then(function(posData) {
            var location = {lat: posData.latitude, long: posData.longitude, acc: posData.accuracy};
            status.set('location', location);
            status.save(null, {
                success: function(status) {
                    console.log('DATA SAVED TO PARSE: ' + key);
                },
                error: function(status, error) {
                    console.error(error, status);
                }
            });
        });
    };

    return o;
});