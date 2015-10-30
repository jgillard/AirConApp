angular.module('app.core')

.factory('DebugService', function(UserService) {
    'use strict';

    var o = {
        appVersion: '0.8.5'
    };

    o.emailDev = function(error, location) {
        var message = JSON.stringify(error);
        var toSubject = 'mailto:jamesgillard@live.co.uk?subject=AirConApp+Error&body=';
        var explanation = 'Something has gone wrong with the app. Please send this email:';
        var device = 'Cordova: ' + window.device.cordova + ', ' +
                     'Manufacturer: ' + window.device.manufacturer + ', ' +
                     'Model: ' + window.device.model + ', ' +
                     'UUID: ' + window.device.uuid + ', ' +
                     'Platform: ' + window.device.platform + ', ' +
                     'Version: ' + window.device.version + ' , ' +
                     'User: ' + UserService.username + ', ' +
                     'App Version: ' + o.appVersion;
        var instance = cordova.InAppBrowser.open( toSubject + explanation + location + message + device, '_system');
    };

    return o;
});