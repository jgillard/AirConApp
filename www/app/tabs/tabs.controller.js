angular.module('app.tabs', [])

.controller('TabsCtrl', function($scope, $state, $ionicViewSwitcher, UserService) {
    'use strict';

    $scope.logout = function() {
        UserService.destroySession();
        $ionicViewSwitcher.nextDirection('back');
        $state.go('login');
    };

    $scope.goSettings = function() {
        $ionicViewSwitcher.nextDirection('forward');
        $state.go('tab.settings');
    };

    $scope.goHome = function() {
        $ionicViewSwitcher.nextDirection('back');
        $state.go('tab.home');
    };

});