angular.module('app.tabs', [])

.controller('TabsCtrl', function($scope, $state, UserService) {
    'use strict';

    $scope.logout = function() {
        UserService.destroySession();
        $state.go('login');
    };

});