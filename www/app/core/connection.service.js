angular.module('app.core')

.factory('ConnectionService', function($cordovaDialogs) {
    'use strict';

    var o = {};

    o.checkConnection = function() {
        if(window.Connection) {
            console.log('window.Connection');
            if(navigator.connection.type == Connection.NONE) {
                $cordovaDialogs.alert('No internet connection.', 'Warning')
                .then(function(result) {
                    if(!result) {
                        ionic.Platform.exitApp();
                    }
               });
            }
        }
    };

    return o;
});