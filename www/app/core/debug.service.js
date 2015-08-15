angular.module('app.core')

.factory('DebugService', function($cordovaDialogs) {
    'use strict';

    var o = {};

    o.emailDev = function(error, location) {
        var message = JSON.stringify(error);
        $cordovaDialogs.alert('Something\'s gone wrong, please send this email')
        .then(function() {
            var ref = cordova.InAppBrowser.open('mailto:jamesgillard@live.co.uk?subject=AirConApp+Error&body=' + location + message, '_system');
        });
    };

    return o;
});