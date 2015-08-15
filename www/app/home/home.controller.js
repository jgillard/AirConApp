angular.module('app.home', [])

.controller('HomeCtrl', function($scope, $ionicLoading, $cordovaDialogs, UserService, PushService, LocationService) {
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
            var numPush = response.length;
            var nextPush = 1893455940;
            for (var push = 0; push < numPush; push++) {
                if (response[push].at < nextPush) nextPush = response[push].at;
            }
            var deltat = Math.round(nextPush - Date.now()/1000);
            console.log(numPush + ' push(es) scheduled in ' + deltat + ' seconds');
            if (numPush > 1) $cordovaDialogs.alert(numPush + ' pushes scheduled\nFirst in ' + deltat + ' seconds');
            else $cordovaDialogs.alert(numPush + ' push scheduled for ' + deltat + ' seconds time!');
        });
    };

    $scope.cancelAll = function() {
        cordova.plugins.notification.local.cancelAll(function() {
            $cordovaDialogs.alert('All pushes cancelled');
        }, this);
    };

    /* GEOLOCATION STUFF */

    $scope.showLocating = function() {
        $ionicLoading.show({
            template: 'Getting your location...',
            delay: 500
        });
    };

    $scope.hideLocating = function(){
        $ionicLoading.hide();
    };

});