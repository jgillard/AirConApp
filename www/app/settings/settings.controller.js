angular.module('app.settings', [])

.controller('SettingsCtrl', function($scope, $ionicDeploy, $cordovaDialogs, $cordovaInAppBrowser, PushService) {
    'use strict';

    $scope.gotoAPK = function() {
        $cordovaInAppBrowser.open('http://jamesgillard.com/AirConApp.apk', '_system');
    };

    $scope.jsconsoleToggle = function(checked) {
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'http://jsconsole.com/remote.js?AirConApp';
        if (checked === true) head.appendChild(script);
    };

    $scope.pushNow = function() {
        PushService.now();
    };

    $scope.getAll = function() {
        cordova.plugins.notification.local.getAll(function (notifications) {
            console.info('Stragglers:', notifications);
            alert(notifications.length);
        });
    };

    $scope.pushSchedule = function(minutes) {
        if (minutes) PushService.schedule(minutes);
        else $cordovaDialogs.alert('Set the time interval', 'Heads Up');
    };

    /* IONIC DEPLOY */

    $scope.hasUpdate = null;

    $scope.checkForUpdates = function() {
        console.log('Ionic Deploy: Checking for updates');
        $ionicDeploy.check().then(function(hasUpdate) {
            console.log('Ionic Deploy: Update available: ' + hasUpdate);
            $scope.hasUpdate = hasUpdate;
            $cordovaDialogs.alert('No update available', 'Nada');
        }, function(err) {
            console.error('Ionic Deploy: Unable to check for updates', err);
            $cordovaDialogs.alert('Error occurred', 'Heads Up');
        });
    };

    $scope.doUpdate = function() {
        if ($scope.hasUpdate === null) $cordovaDialogs.alert('Other button first', 'Woah there!');
        else if (!$scope.hasUpdate) $cordovaDialogs.alert('I already said no update', 'Pay attention');
        else {
            $ionicDeploy.update().then(function(res) {
                console.log('Ionic Deploy: Update Success! ', res);
                $cordovaDialogs.alert('Update installed', 'Heads Up');
            }, function(err) {
                console.log('Ionic Deploy: Update error! ', err);
                $cordovaDialogs.alert('Error occurred', 'Heads Up');
            }, function(prog) {
                console.log('Ionic Deploy: Progress... ', prog);
            });
        }
    };

});