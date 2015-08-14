angular.module('app.core')

.factory('LocationService', function($q, $cordovaGeolocation, $cordovaDialogs) {
    'use strict';

    var o = {};

    o.locationEnabled = function() {
        cordova.plugins.diagnostic.isLocationEnabled(function(enabled) {
            if (!enabled) {
                console.log('location disabled');
                $cordovaDialogs.alert('We need location data on for this app to work', 'Location disabled')
                .then(function() {
                    cordova.plugins.diagnostic.switchToLocationSettings();
                });
            }
        }, function(error){
            console.log('services.locationEnabled: ' + error);
        });
    };

    o.getCurrentPosition = function(timeout) {
        if (typeof timeout === 'undefined') timeout = 5000;
        var defer = $q.defer();
        // 5 second timeout, 5 minute maxAge
        var posOptions = {timeout: timeout, maximumAge: 300000, enableHighAccuracy: false};
        $cordovaGeolocation.getCurrentPosition(posOptions)
            .then(function (position) {
                var posData = {};
                posData.latitude = position.coords.latitude.toFixed(5);
                posData.longitude = position.coords.longitude.toFixed(5);
                posData.accuracy = Math.round(position.coords.accuracy);
                console.log('geoloc updated @services.getCurPos');
                defer.resolve(posData);
            }, function(err) {
                console.error('services.getCurPos: ' + err);
                defer.reject('Could not get your location');
            })
        ;
        return defer.promise;
    };

    return o;
});