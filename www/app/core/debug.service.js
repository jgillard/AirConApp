angular.module('app.core')

.factory('DebugService', function($cordovaDialogs) {
    'use strict';

    var o = {};

    o.emailDev = function(error, location) {
        var message = JSON.stringify(error);
        $cordovaDialogs.alert('Something\'s gone wrong, please send this email')
        .then(function() {
            window.open('mailto:jamesgillard@live.co.uk?subject=AirConApp+Error&body=' + location + message);
        });
    };

    return o;
});