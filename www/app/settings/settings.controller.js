angular.module('app.settings', [])

.controller('SettingsCtrl', function($scope, $cordovaDialogs, $cordovaInAppBrowser, $state,
    $ionicViewSwitcher, $localStorage, PushService) {
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

});