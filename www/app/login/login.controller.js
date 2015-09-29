angular.module('app.login', [])

.controller('LoginCtrl', function($scope, $state, $cordovaDialogs, $ionicViewSwitcher, UserService, DebugService) {
    'use strict';

    $scope.submitForm = function(username, password, email, signingUp) {
        if (!username) {
            $cordovaDialogs.alert('Please enter a username.', ''); return;
        } else if (!password) {
            $cordovaDialogs.alert('Please enter a password.', ''); return;
        } else if (!email && signingUp) {
            $cordovaDialogs.alert('Please enter an email address.', ''); return;
        }

        // Logout existing user session
        if (Parse.User.current()) Parse.destroySession;

        if (window.cordova) {
            window.plugins.sim.getSimInfo(function(simInfo) {
                if(simInfo.simState === 5) {
                    if (!$scope.validPhoneNum(simInfo.phoneNumber)) return;
                    $scope.callAuth(username, password, email, simInfo.phoneNumber, signingUp);
                } else {
                    console.log(simInfo);
                    $cordovaDialogs.alert('SIM error.', '');
                }
            }, function(error) {
                console.log(error);
                DebugService.emailDev(error, 'login.controller:submitForm:getSimInfo');
                if (signingUp) {
                    $cordovaDialogs.prompt('Please enter this phone\'s number.', error, ['Submit'])
                    .then(function(result) {
                       if (!$scope.validPhoneNum(result.input1)) return;
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

    $scope.validPhoneNum = function(number) {
        if ((number.substring(0,2) === '07' && number.length === 11) ||
            (number.substring(0,4) === '+447' && number.length === 13)) {
            return true;
        } else {
            $cordovaDialogs.alert('Invalid mobile number.', '');
            return false;
        }
    };

    $scope.callAuth = function(username, password, email, phoneNum, signingUp) {
        UserService.auth(username, password, email, phoneNum, signingUp).then(function() {
            $ionicViewSwitcher.nextDirection('forward');
            $state.go('tab.home');
        }, function(error) {
            if (error.code === 101) {
                $cordovaDialogs.alert('Invalid login details.', '');
            } else if (error.code === 203) {
                $cordovaDialogs.alert('Email address already in use.', '');
            } else {
                DebugService.emailDev(error, 'login.controller:callAuth');
                console.log('UserService.auth ' + error.message + ' Error: ' + error.code);
            }
        });
    };

    $scope.resetPW = function() {
        $cordovaDialogs.prompt('Please enter your email address:', 'Password Reset', ['Reset', 'Cancel'])
        .then(function(result) {
            if (result.buttonIndex == 1) {
                var email = result.input1;
                Parse.User.requestPasswordReset(email, {
                    success: function() {
                        $cordovaDialogs.alert('You\'ll recieve an email shortly.', '');
                    }, error: function(error) {
                        if (error.code === 125) {
                            $cordovaDialogs.alert('Invalid email address.', '');
                        } else if (error.code === 205) {
                            $cordovaDialogs.alert('Email address not found.', '');
                        } else {
                            console.log('ResetPW error: ' + error.code + ' ' + error.message);
                            DebugService.emailDev(error, 'login.controller:resetPW:Parse.User.requestPasswordReset');
                        }
                    }
                });
            }
        });
    };

});