angular.module('app.settings', [])

.controller('SettingsCtrl', function($scope, $ionicDeploy, $cordovaDialogs, $cordovaInAppBrowser, $state,
    $ionicViewSwitcher, $localStorage, PushService, DebugService) {
    'use strict';

    $scope.goHome = function() {
        $ionicViewSwitcher.nextDirection('back');
        $state.go('tab.home');
    };

    $scope.gotoAPK = function() {
        $cordovaInAppBrowser.open('http://jamesgillard.com/AirConApp.apk', '_system');
    };

    $scope.jsconsoleToggle = function(checked) {
        $cordovaDialogs.alert('Function currently disabled.', '');
        return;
        // var head = document.getElementsByTagName('head')[0];
        // var script = document.createElement('script');
        // script.type = 'text/javascript';
        // script.src = 'http://jsconsole.com/remote.js?AirConApp';
        // if (checked === true) head.appendChild(script);
    };

    $scope.sendAck = function() {
        PushService.sendAck();
    };

    $scope.pushSchedule = function(minutes) {
        if (minutes) PushService.schedule(minutes);
        else $cordovaDialogs.alert('Set the time interval.', '');
    };

    $scope.showParseQueue = function() {
        alert(JSON.stringify($localStorage.parseQueue));
        console.log($localStorage.parseQueue);
    };

    $scope.showPushQueue = function() {
        alert(JSON.stringify($localStorage.pushQueue));
        console.log($localStorage.pushQueue);
    };

    /* IONIC DEPLOY */

    $scope.hasUpdate = null;

    $scope.checkForUpdates = function() {
        console.log('Ionic Deploy: Checking for updates');
        $ionicDeploy.check().then(function(hasUpdate) {
            console.log('Ionic Deploy: Update available: ' + hasUpdate);
            $scope.hasUpdate = hasUpdate;
            $cordovaDialogs.alert('No update available');
        }, function(err) {
            console.error('Ionic Deploy: Unable to check for updates', err);
            DebugService.emailDev(err, 'settings.controller:checkforUpdate:ionicDeploy.check');
        });
    };

    $scope.doUpdate = function() {
        if ($scope.hasUpdate === null) $cordovaDialogs.alert('Other button first dummy');
        else if (!$scope.hasUpdate) $cordovaDialogs.alert('I already said no update!');
        else {
            $ionicDeploy.update().then(function(res) {
                console.log('Ionic Deploy: Update Success! ', res);
                $cordovaDialogs.alert('Update installed');
            }, function(err) {
                console.log('Ionic Deploy: Update error! ', err);
                DebugService.emailDev(err, 'settings.controller:doUpdate:ionicDeploy.update');
            }, function(prog) {
                console.log('Ionic Deploy: Progress... ', prog);
            });
        }
    };

});