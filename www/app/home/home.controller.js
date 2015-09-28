angular.module('app.home', [])

.controller('HomeCtrl', function($scope, $ionicLoading, $ionicPlatform, $cordovaDialogs, $state,
        $ionicViewSwitcher, $localStorage, UserService, PushService, LocationService) {
    'use strict';

    $scope.username = UserService.username;
    $scope.gotLoc = false;

    // Defaults for development
    $scope.end = new Date();

   $scope.init = function() {
        console.log('getPos from Home init()');
        LocationService.getCurrentPosition().then(function() {
            $scope.gotLoc = true;
        }, function() {
            $scope.gotLoc = false;
        });
    };
    $scope.init();

    $ionicPlatform.on('resume', function(){
        $scope.gotLoc = false;
        LocationService.getCurrentPosition().then(function() {
            $scope.gotLoc = true;
        }, function() {
            $scope.gotLoc = false;
        });
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
            else $cordovaDialogs.alert('That end time is in the past!');
        } else {
            $cordovaDialogs.alert('You missed something');
        }
    };

    $scope.isScheduled = function() {
        cordova.plugins.notification.local.getScheduled(function (response) {
            if (!response[0]) {
                $cordovaDialogs.alert('No pushes scheduled');
                return;
            }
            console.log(response);
            var queuedPush = $localStorage.pushQueue.length;
            var nextPush = response[0].at;
            var deltat = Math.round(nextPush - Date.now()/1000);

            // include the currently pending push (not in queue)
            var numPush = queuedPush + 1;
            if (numPush > 1) $cordovaDialogs.alert(numPush + ' pushes scheduled\nNext in ' + deltat + ' seconds');
            else $cordovaDialogs.alert(numPush + ' push scheduled for ' + deltat + ' seconds time!');
        });
    };

    $scope.cancelAll = function() {
        cordova.plugins.notification.local.cancelAll(function() {
            $cordovaDialogs.alert('All pushes cancelled');
        }, this);
    };

});