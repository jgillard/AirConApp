angular.module('app.home', [])

.controller('HomeCtrl', function($scope, $ionicPlatform, $cordovaDialogs, $state, $timeout,
        PushService, LocationService) {
    'use strict';

    $scope.updateGeoBtn = function() {
        $scope.gotLoc = false;
        LocationService.getCurrentPosition().then(function() {
            $scope.gotLoc = true;
        }, function() {
            $scope.gotLoc = false;
        });
    };

    var init = function() {
        console.log('getPos from Home init()');
        $scope.updateGeoBtn();
    };
    init();

    $ionicPlatform.on('resume', function(){
        $scope.updateGeoBtn();
    });

    /* PUSH NOTIFICATION STUFF */

    $scope.multiple = {};

    $scope.showPicker = function() {
        if (!$scope.multiple.interval) {
            $cordovaDialogs.alert('No interval entered.', '');
            return;
        }
        if (!$scope.multiple.location) {
            $cordovaDialogs.alert('No location entered.', '');
            return;
        }

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
        LocationService.locStr = $scope.multiple.location;
        var delta = new Date() - end;

        if (delta > 0) {
            $cordovaDialogs.alert('That end time is in the past.', '', 'i\'ll change it');
        }
        if (interval && location && end && delta < 0) {
            PushService.first(interval, end);
        }
    };

    $scope.countdown = {
        mins: '0',
        secs: '0',
        pushesLeft: 0
    };

    var updateCountdown = function() {
        cordova.plugins.notification.local.getScheduled(function (response) {
            if (!response[0]) {
                $scope.countdown.mins = '00';
                $scope.countdown.secs = '00';
                $scope.countdown.pushesLeft = 0;
            } else {
                var pushData = eval('(' +  response[0].data + ')');
                $scope.countdown.pushesLeft = pushData.pushesLeft;
                var nextPush = response[0].at;
                var deltaSecs = nextPush - Date.now()/1000;
                var mins = Math.floor(deltaSecs / 60);
                var secs = Math.floor(deltaSecs % 60);
                $scope.countdown.mins = ('00' + mins).slice(-2);
                $scope.countdown.secs = ('00' + secs).slice(-2);
            }
        });
        $timeout(updateCountdown, 1000);
    };

    updateCountdown();

    $scope.cancelAll = function() {
        cordova.plugins.notification.local.cancelAll(function() {
            PushService.sendAck();
            $cordovaDialogs.alert('All pushes cancelled and reset.', '');
        }, this);
    };

});