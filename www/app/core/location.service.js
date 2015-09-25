angular.module('app.core')

.factory('LocationService', function($q, $cordovaGeolocation, $cordovaDialogs, DebugService) {
    'use strict';

    var o = {};

    o.locationEnabled = function() {
        cordova.plugins.diagnostic.isLocationEnabled(function(enabled) {
            if (!enabled) {
                console.log('location disabled');
                $cordovaDialogs.alert('We need to turn on location data on for this app to work')
                .then(function() {
                    cordova.plugins.diagnostic.switchToLocationSettings();
                });
            }
        }, function(error){
            console.log('services.locationEnabled: ' + error);
            DebugService.emailDev(error, 'location.service:locationEnabled:cdv.plgs.diag.isLocEn');
        });
    };

    o.getCurrentPosition = function(timeout) {
        if (typeof timeout === 'undefined') timeout = 30000;
        var defer = $q.defer();
        // 30 second timeout, 5 minute maxAge
        var posOptions = {timeout: timeout, maximumAge: 0, enableHighAccuracy: true};
        $cordovaGeolocation.getCurrentPosition(posOptions)
            .then(function (position) {
                var posData = {};
                posData.latitude = position.coords.latitude.toFixed(5);
                posData.longitude = position.coords.longitude.toFixed(5);
                posData.accuracy = Math.round(position.coords.accuracy);
                defer.resolve(posData);
            }, function(err) {
                console.error('services.getCurPos: ' + err);
                DebugService.emailDev(err, 'location.service:getCurPos:cdvGeo.getCurPos');
                defer.reject('Could not get your location');
            })
        ;
        return defer.promise;
    };

    return o;
});