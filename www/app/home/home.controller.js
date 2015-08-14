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

    $scope.pushMultiple = function(interval, end) {
        var delta = new Date() - end;
        if (interval && end) {
            if (delta < 0) PushService.multiple(interval, end, $scope.isScheduled);
            else $cordovaDialogs.alert('That end time is in the past!', 'Heads Up');
        } else {
           alert('ELSE');
            $cordovaDialogs.alert('You missed something', 'Heads Up');
        }
    };

    $scope.isScheduled = function() {
        // Only deals with single scheduled push (deal with multiple and zero)
        cordova.plugins.notification.local.getScheduled(function (response) {
            if (!response[0]) {
                $cordovaDialogs.alert('No pushes scheduled', 'Nope!');
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
            if (numPush > 1) $cordovaDialogs.alert(numPush + ' pushes scheduled\nFirst in ' + deltat + ' seconds', 'News Alert');
            else $cordovaDialogs.alert(numPush + ' push scheduled for ' + deltat + ' seconds time!', 'News Alert');
        });
    };

    $scope.cancelAll = function() {
        cordova.plugins.notification.local.cancelAll(function() {
            $cordovaDialogs.alert('All pushes cancelled', 'Done');
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