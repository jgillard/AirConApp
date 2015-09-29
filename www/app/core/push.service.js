angular.module('app.core')

.factory('PushService', function($cordovaLocalNotification, $cordovaDialogs, $localStorage, ParseService) {
    'use strict';

    var o = {};

    var icon = 'file://assets/img/doge.jpg';

    o.sendAck = function() {
        // fake notification for acknowledge()
        var notification = {};
        notification.data = '{"func":"reset"}';
        o.acknowledge(notification);
    };

    o.schedule = function(minutes) {
        var scheduleTime = new Date();
        // scheduleTime.setMinutes(scheduleTime.getMinutes() + minutes);
        scheduleTime.setSeconds(scheduleTime.getSeconds() + minutes); // for development
        $cordovaLocalNotification.schedule({
            id: 0,
            text: 'Swipe to acknowledge',
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

        // Put all pushes into LocalStorage PushQueue, and schedule 1st
        $localStorage.pushQueue = [];
        var nextPush = now;
        for (var i = 0; i < numPushes; i++) {
            nextPush.setMinutes(nextPush.getMinutes() + interval);
            var nextPush2 = Math.round(nextPush.getTime() / 1000);
            $localStorage.pushQueue[i] = {
                id: i,
                text: 'Swipe to acknowledge',
                // every: interval, // string only in iOS (e.g. 'minutes', 'hours')
                at: nextPush2,
                data: { func: 'multiple' },
                icon: icon
            };
        }
        $cordovaLocalNotification.schedule($localStorage.pushQueue.shift());
        setTimeout(callback, 500);
    };

    o.acknowledge = function(notification) {
        var acknowledgedTime = new Date();
        ParseService.savePush('pushAcknowledged', acknowledgedTime);
        $cordovaLocalNotification.clearAll();
        var pushData = eval('(' + notification.data + ')');
        // Branch based on what function scheduled the notification
        if (pushData.func !== 'reset') {
            // MULTIPLE: For queued pushes, wait until none left
            cordova.plugins.notification.local.getAllScheduled(function (response) {
                if (response === 'undefined' || response.length === 0) {
                     $cordovaDialogs.alert('That was the last one.\nSchedule more if still working.', '', 'understood');
                }
            });
        }
    };

    return o;
});