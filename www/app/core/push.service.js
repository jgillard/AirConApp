angular.module('app.core')

.factory('PushService', function($cordovaLocalNotification) {
    'use strict';

    var o = {};

    var icon = 'file://assets/img/doge.jpg';

    o.now = function() {
       $cordovaLocalNotification.schedule({
            id: 0,
            text: 'Test Push Now',
            data: { func: 'now' },
            icon: icon,
            sound: 'file://assets/sound/eagle.wav'
        });
    };

    o.schedule = function(minutes) {
        var scheduleTime = new Date();
        // scheduleTime.setMinutes(scheduleTime.getMinutes() + minutes);
        scheduleTime.setSeconds(scheduleTime.getSeconds() + minutes); // for development
        $cordovaLocalNotification.schedule({
            id: 0,
            text: 'Schedule Local Push',
            at: scheduleTime,
            data: { func: 'schedule', minutes: minutes},
            icon: icon
        });
    };

    o.multiple = function(interval, end, callback) {
        $cordovaLocalNotification.cancelAll();

        var now = new Date();
        var deltaSecs = Math.round((end - now) / 1000);
        var deltaMins = Math.round((deltaSecs) / 60);
        var numPushes = Math.round(deltaMins / interval);

        console.log('Multiple Scheduling Calcs', {end: end, endGetTime: end.getTime(),
                nowGetTime: now.getTime(), dMins: deltaMins, dSecs: deltaSecs, numPushes: numPushes});

        var pushArray = [];
        var nextPush = now;
        for (var i = 0; i < numPushes; i++) {
            nextPush.setMinutes(nextPush.getMinutes() + interval);
            var nextPush2 = Math.round(nextPush.getTime() / 1000);
            pushArray[i] = {
                id: i,
                text: 'Schedule Multiple Pushes',
                // every: interval, // string only in iOS (e.g. 'minutes', 'hours')
                at: nextPush2,
                data: { func: 'multiple' },
                icon: icon
            };
        }
        $cordovaLocalNotification.schedule(pushArray);
        setTimeout(callback, 500);
    };

    return o;
});