angular.module('app.login', [])

.controller('LoginCtrl', function($scope, $cordovaDialogs, LoginService, DebugService) {
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

        if (!window.cordova) {
            LoginService.callAuth(formInfo, null);
            return;
        }

        window.plugins.sim.getSimInfo(
            function(simInfo) {
                LoginService.getSimInfoSuccess(simInfo, formInfo);
            },
            function(error) {
                LoginService.getSimInfoFailure(error,formInfo);
            }
        );
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