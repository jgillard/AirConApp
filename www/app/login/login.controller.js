angular.module('app.login', [])

.controller('LoginCtrl', function($scope, $state, $cordovaDialogs, UserService, DebugService) {
    'use strict';

    // Defaults for development
    $scope.username = 'James';
    $scope.password = 'James';

    $scope.submitForm = function(username, password, email, signingUp) {
        if (!username) {
            $cordovaDialogs.alert('Please enter a username'); return;
        } else if (!password) {
            $cordovaDialogs.alert('Please enter a password'); return;
        } else if (!email && signingUp) {
            $cordovaDialogs.alert('Please enter an email address'); return;
        }

        // Logout existing user session
        if (Parse.User.current()) Parse.destroySession;

        if (window.cordova) {
            window.plugins.sim.getSimInfo(function(simInfo) {
                if (!$scope.validatePhoneNum(simInfo.phoneNumber)) return;
                $scope.callAuth(username, password, email, simInfo.phoneNumber, signingUp);
            }, function(error) {
                console.log(error);
                if (signingUp) {
                    $cordovaDialogs.prompt('Please enter this phone\'s number', error, ['Submit'])
                    .then(function(result) {
                       if (!$scope.validatePhoneNum(result.input1)) return;
                        $scope.callAuth(username, password, email, result.input1, signingUp);
                    });
                } else {
                    $scope.callAuth(username, password, email, undefined, signingUp);
                }
            });
        } else {
            $scope.callAuth(username, password, email, undefined, signingUp);
        }
    };

    $scope.validatePhoneNum = function(number) {
        if ((number.substring(0,2) === '07' && number.length === 11) ||
            (number.substring(0,4) === '+447' && number.length === 13)) {
            return true;
        } else {
            $cordovaDialogs.alert('Invalid mobile number');
            return false;
        }
    };

    $scope.callAuth = function(username, password, email, phoneNum, signingUp) {
        UserService.auth(username, password, email, phoneNum, signingUp).then(function() {
            $state.go('tab.home');
        }, function(error) {
            $cordovaDialogs.alert(error.message, 'Error: ' + error.code, 'Try again!');
            console.log('UserService.auth ' + error.message + ' Error: ' + error.code);
        });
    };

    $scope.resetPW = function() {
        $cordovaDialogs.prompt('Please enter your email address', 'Password Reset', ['Go', 'Cancel'])
        .then(function(result) {
            if (result.buttonIndex == 1) {
                var email = result.input1;
                Parse.User.requestPasswordReset(email, {
                    success: function() {
                        $cordovaDialogs.alert('You\'ll recieve an email shortly');
                    }, error: function(error) {
                        console.log('ResetPW error: ' + error.code + ' ' + error.message);
                        DebugService.emailDev(error, 'login.controller:resetPW:Parse.User.requestPasswordReset');
                    }
                });
            }
        });
    };

});