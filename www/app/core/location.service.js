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

    /* BACKGROUND GEOLOC */

    o.posData = {};
    o.bgGeoEnabled = false;

    o.callbackFn = function(location) {
        console.log('[js] BackgroundGeoLocation callback:', location);
        o.posData.latitude = parseFloat(location.latitude).toFixed(5);
        o.posData.longitude = parseFloat(location.longitude).toFixed(5);
        o.posData.accuracy = Math.round(parseFloat(location.accuracy));
        o.bgGeoEnabled = true;

        var GeoLoc = Parse.Object.extend('GeoLoc');
        var geoLoc = new GeoLoc();
        geoLoc.set('lat', o.posData.latitude);
        geoLoc.set('long', o.posData.longitude);
        geoLoc.set('acc', o.posData.accuracy);
        geoLoc.save(null, {
            success: function(geoLoc) {
            },
            error: function(geoLoc, error) {
                alert('geoloc save error');
                console.log(error);
            }
        });

        window.backgroundGeoLocation.finish();
    };

    o.failureFn = function(error) {
        console.log('BackgroundGeoLocation error: ' + error);
        emailDev(error, 'location.service:bgGeolocStart:failureFn');
    };

    o.bgGeolocStart = function() {
        window.backgroundGeoLocation.configure(o.callbackFn, o.failureFn, {
            desiredAccuracy: 100,
            stationaryRadius: 50,
            distanceFilter: 50,
            notificationTitle: 'AirConApp Location Tracking',
            notificationText: 'ENABLED',
            locationTimeout: 300, // minimum interval in seconds
            debug: true, // beeps on event
            stopOnTerminate: true // forces stop() on app termination
        });
        window.backgroundGeoLocation.start();
    };

    o.bgGeolocStop = function() {
        window.backgroundGeoLocation.stop();
        o.bgGeoEnabled = false;
    };

    return o;
});