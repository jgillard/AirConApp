angular.module('app.login', [])

.controller('LoginCtrl', function($scope, $state, $cordovaDialogs, $ionicViewSwitcher, UserService, DebugService) {
    'use strict';

    $scope.submitForm = function(username, password, email, signingUp) {
        // Make sure all info has been entered
        if (!username) {
            $cordovaDialogs.alert('Please enter a username.', '');
            return;
        } else if (!password) {
            $cordovaDialogs.alert('Please enter a password.', '');
            return;
        } else if (!email && signingUp) {
            $cordovaDialogs.alert('Please enter an email address.', '');
            return;
        }

        // Logout existing user session
        if (Parse.User.current()) Parse.destroySession;

        var formInfo = {username: username, password: password, email: email, signingUp: signingUp};

        window.plugins.sim.getSimInfo(
            function(simInfo) {
                getSimInfoSuccess(simInfo, formInfo);
            },
            function(error) {
                getSimInfoFailure(error,formInfo);
            }
        );
    };

    var getSimInfoFailure = function(error, f) {
        console.log('getSimInfo ' + error);
        console.log('FailureF ' + f);
        DebugService.emailDev(JSON.stringify(error), 'login.controller:submitForm:getSimInfo');
        askPhoneNum();
    };

    var getSimInfoSuccess = function(simInfo, f) {
        console.log('successF');
        console.log(simInfo.phoneNumber);
        if(simInfo.simState === 5) {
            // if (validPhoneNum(simInfo.phoneNumber)) {
            if (false) {
                callAuth(f.username, f.password, f.email, simInfo.phoneNumber, f.signingUp);
            } else {
                console.log('success valid else');
                askPhoneNum(f);
            }
        } else {
            console.log(simInfo);
            $cordovaDialogs.alert('SIM error.', '');
        }
    };

    var askPhoneNum = function(f) {
        console.log('askPhoneNum');
        $cordovaDialogs.prompt('Please enter this phone\'s mobile number.')
        .then(function(result) {
            if (validPhoneNum(result.input1)) {
                callAuth(f.username, f.password, f.email, result.input1, f.signingUp);
            } else {
                askPhoneNum();
            }
        });
    };

    var validPhoneNum = function(number) {
        console.log('validPhoneNum');
        if ((number.substring(0,2) === '07' && number.length === 11) ||
            (number.substring(0,4) === '+447' && number.length === 13)) {
            return true;
        } else {
            return false;
        }
    };

    var callAuth = function(username, password, email, phoneNum, signingUp) {
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