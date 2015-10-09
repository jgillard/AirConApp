angular.module('app.core')

.factory('PushService', function($cordovaLocalNotification, $cordovaDialogs, $localStorage, ParseService) {
    'use strict';

    var o = {
        lastInterval: 0
    };

    var icon = 'file://assets/img/doge.jpg';

    o.sendAck = function() {
        // fake notification for acknowledge()
        var notification = {};
        notification.data = '{"func":"reset"}';
        o.acknowledge(notification);
    };

    o.next = function(pushesLeft) {
        var scheduleTime = new Date();
        scheduleTime.setMinutes(scheduleTime.getMinutes() + o.lastInterval);
        var pushDetails = {
            id: pushesLeft,
            at: scheduleTime,
            data: { func: 'next',
                    pushesLeft: pushesLeft},
            icon: icon
        };
        if (pushesLeft > 1) {
            pushDetails.text = 'Swipe to acknowledge';
        } else {
            pushDetails.text = 'FINAL PUSH. TAP FOR MORE';
        }

        $cordovaLocalNotification.schedule(pushDetails);
    };

    o.first = function(interval, end) {
        $cordovaLocalNotification.cancelAll();

        var now = new Date();
        var deltaMins = Math.round((end - now) / 60000);
        var numPushes = Math.round(deltaMins / interval);

        console.log('Multiple Scheduling Calcs', {end: end, endGetTime: end.getTime(),
                nowGetTime: now.getTime(), dMins: deltaMins, numPushes: numPushes});

        o.lastInterval = interval;
        console.log(o.lastInterval);
        o.next(numPushes);

        setTimeout(o.fuzzyQueryScheduled, 500);
    };

    o.acknowledge = function(notification) {
        var acknowledgedTime = new Date();
        $cordovaLocalNotification.clearAll();
        ParseService.savePush('pushAcknowledged', acknowledgedTime);
        var pushData = eval('(' + notification.data + ')');
        if (pushData.func === 'next' && pushData.pushesLeft === 0) {
            $cordovaDialogs.alert('That was the last one.\nSchedule more if still working.', '', 'understood');
        }
    };

    o.fuzzyQueryScheduled = function() {
        cordova.plugins.notification.local.getScheduled(function (response) {
            var nextPush = response[0].at;
            var deltaSec = Math.round(nextPush - Date.now()/1000);
            var deltaMin = Math.round(deltaSec / 60);

            var pushData = eval('(' +  response[0].data + ')');
            var numPush = pushData.pushesLeft;
            if (numPush > 1) {
                var string = numPush + ' pushes scheduled';
                if (deltaMin > 1) $cordovaDialogs.alert(string + '.\nNext in ' + deltaMin + ' minutes.', '');
                else if (deltaMin === 1) $cordovaDialogs.alert(string + '.\nNext in 1 minute.', '');
                else $cordovaDialogs.alert(string + '.\nNext in < 1 minute.', '');
            } else {
                var string = '1 push scheduled';
                if (deltaMin > 0) $cordovaDialogs.alert(string + ' for ' + deltaMin + ' minutes time.', '');
                else $cordovaDialogs.alert(string + ' for < 1 minutes time.', '');
            }
        });
    };

    return o;
});