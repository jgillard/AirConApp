angular.module('app.settings', [])

.controller('SettingsCtrl', function($scope, $cordovaDialogs, $cordovaInAppBrowser, $state,
    $ionicViewSwitcher, $localStorage) {
    'use strict';

    $scope.gotoAPK = function() {
        $cordovaInAppBrowser.open('http://jamesgillard.com/AirConApp.apk', '_system');
    };

    $scope.jsconsoleToggle = function(checked) {
        //$cordovaDialogs.alert('Function currently disabled.', '');
        //return;
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'http://jsconsole.com/remote.js?AirConApp';
        if (checked === true) head.appendChild(script);
    };

    $scope.showParseQueue = function() {
        alert(JSON.stringify($localStorage.parseQueue));
        console.log($localStorage.parseQueue);
    };

});