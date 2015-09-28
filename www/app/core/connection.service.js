angular.module('app.core')

.factory('ConnectionService', function($cordovaDialogs, $localStorage, ParseService) {
    'use strict';

    var o = {};

    o.checkConnection = function() {
        if(window.Connection) {
            if(navigator.connection.type === Connection.NONE) {
                // $cordovaDialogs.alert('No internet connection.', 'Warning');
            }
        }
    };

    document.addEventListener('online', onOnline, false);

    function onOnline() {
        var parseQueue = $localStorage.parseQueue;
        $localStorage.parseQueue = [];
        if (parseQueue.length > 0) {
            console.log('parseQueue: ' + parseQueue.length);
            setTimeout(function() {
                for (var i = 0; i < parseQueue.length; i++) {
                    console.log('retrySave ' + i);
                    ParseService.retrySave(parseQueue[i]);
                }
            }, 5000);
        }
    }

    return o;
});