angular.module('app.core')

.factory('DebugService', function($cordovaDialogs) {
    'use strict';

    var o = {};

    o.emailDev = function(error, location) {
        var message = JSON.stringify(error);
        var toSubject = 'mailto:jamesgillard@live.co.uk?subject=AirConApp+Error&body=';
        var explanation = 'Something has gone wrong with the app. Please send this email:\n\n';
        var instance = cordova.InAppBrowser.open( toSubject + explanation + location + message, '_system');
    };

    return o;
});