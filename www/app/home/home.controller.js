angular.module('app.home', [])

.controller('HomeCtrl', function($scope, $ionicLoading, $ionicPlatform, $cordovaDialogs, $state,
        $ionicViewSwitcher, $localStorage, UserService, PushService, LocationService) {
    'use strict';

    var updateGeoBtn = function() {
        $scope.gotLoc = false;
        LocationService.getCurrentPosition().then(function() {
            $scope.gotLoc = true;
        }, function() {
            $scope.gotLoc = false;
        });
    };

    var init = function() {
        console.log('getPos from Home init()');
        updateGeoBtn();
    };
    init();

    $ionicPlatform.on('resume', function(){
        updateGeoBtn();
    });

    $scope.goSettings = function() {
        $ionicViewSwitcher.nextDirection('forward');
        $state.go('tab.settings');
    };

    /* PUSH NOTIFICATION STUFF */

    $scope.multiple = {};

    $scope.showPicker = function() {
        var options = {
            date: new Date(),
            mode: 'time',
            androidTheme: 4
        };
        datePicker.show(options,
            function(time) {
                $scope.pushMultiple(time);
            }, function(error) {
                console.log(error);
            }
        );
    };

    $scope.pushMultiple = function(end) {
        var interval = $scope.multiple.interval;
        var delta = new Date() - end;
        if (interval && end) {
            if (delta < 0) PushService.multiple(interval, end, $scope.isScheduled);
            else $cordovaDialogs.alert('That end time is in the past.', '', 'i\'ll change it');
        } else {
            $cordovaDialogs.alert('No interval entered.', '');
        }
    };

    $scope.isScheduled = function() {
        cordova.plugins.notification.local.getScheduled(function (response) {
            if (!response[0]) {
                $cordovaDialogs.alert('No pushes scheduled.', '');
                return;
            }
            console.log(response);
            var queuedPush = $localStorage.pushQueue.length;
            var nextPush = response[0].at;
            var deltaSec = Math.round(nextPush - Date.now()/1000);
            var deltaMin = Math.round(deltaSec / 60);

            // include the currently pending push (not in queue)
            var numPush = queuedPush + 1;
            if (numPush > 1) {
                if (deltaMin > 1) $cordovaDialogs.alert(numPush + ' pushes scheduled.\nNext in ' + deltaMin + ' minutes.', '');
                else $cordovaDialogs.alert(numPush + ' pushes scheduled.\nNext in ' + deltaMin + ' minute.', '');
            }
            else $cordovaDialogs.alert(numPush + ' push scheduled for ' + deltaMin + ' minutes time.', '');
        });
    };

    $scope.cancelAll = function() {
        cordova.plugins.notification.local.cancelAll(function() {
            PushService.sendAck();
            $cordovaDialogs.alert('All pushes cancelled and reset.', '');
        }, this);
    };

});