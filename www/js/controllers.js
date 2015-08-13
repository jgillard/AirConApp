angular.module('AirConApp.controllers', ['ionic', 'ionic.service.deploy', 'AirConApp.services'])

.controller('HomeCtrl', function($scope, $timeout, $http, $cordovaLocalNotification,
            $cordovaGeolocation, $ionicLoading, $cordovaDialogs, $ionicPlatform,
            User, Push, ParseService) {
    'use strict';

    $scope.username = User.username;
    $scope.gotLoc = false;

    // Defaults for development
    $scope.end = new Date();

    $scope.init = function() {
        console.log('getPos from init');
        ParseService.getCurrentPosition().then(function() {
            console.log('got pos from init');
            $scope.gotLoc = true;
        });
    };
    $scope.init();

    /* PUSH NOTIFICATION STUFF */

    $scope.pushMultiple = function(interval, end) {
        var delta = new Date() - end;
        if (interval && end) {
            if (delta < 0) Push.multiple(interval, end, $scope.isScheduled);
            else $cordovaDialogs.alert('That end time is in the past!', 'Heads Up');
        } else {
           alert('ELSE');
            $cordovaDialogs.alert('You missed something', 'Heads Up');
        }
    };

    $scope.isScheduled = function() {
        // Only deals with single scheduled push (deal with multiple and zero)
        cordova.plugins.notification.local.getScheduled(function (response) {
            if (!response[0]) {
                $cordovaDialogs.alert('No pushes scheduled', 'Nope!');
                return;
            }
            console.log(response);
            var numPush = response.length;
            var nextPush = 1893455940;
            for (var push = 0; push < numPush; push++) {
                if (response[push].at < nextPush) nextPush = response[push].at;
            }
            var deltat = Math.round(nextPush - Date.now()/1000);
            console.log(numPush + ' push(es) scheduled in ' + deltat + ' seconds');
            if (numPush > 1) $cordovaDialogs.alert(numPush + ' pushes scheduled\nFirst in ' + deltat + ' seconds', 'News Alert');
            else $cordovaDialogs.alert(numPush + ' push scheduled for ' + deltat + ' seconds time!', 'News Alert');
        });
    };

    $scope.cancelAll = function() {
        cordova.plugins.notification.local.cancelAll(function() {
            $cordovaDialogs.alert('All pushes cancelled');
        }, this);
    };

    /* GEOLOCATION STUFF */

    $scope.showLocating = function() {
        $ionicLoading.show({
            template: 'Getting your location...',
            delay: 500
        });
    };

    $scope.hideLocating = function(){
        $ionicLoading.hide();
    };

})



.controller('SplashCtrl', function($scope, $state, $cordovaDialogs, $ionicModal, User) {
    'use strict';

    // Defaults for development
    $scope.username = 'James';
    $scope.password = 'James';

    $scope.submitForm = function(username, password, email, signingUp) {
        if (!username) {
            $cordovaDialogs('Please enter a username', 'Username', 'OK'); return;
        } else if (!password) {
            $cordovaDialogs('Please enter a password', 'Username', 'OK'); return;
        } else if (!email && signingUp) {
            $cordovaDialogs('Please enter an email address', 'Email', 'OK'); return;
        }

        // Logout existing user session
        if (Parse.User.current()) Parse.destroySession;

        if (window.plugins) {
            window.plugins.phonenumber.get(function(phoneNum) {
                console.log('phoneNum: ' + phoneNum);
                if (!$scope.validatePhoneNum(phoneNum)) return;
                $scope.callAuth(username, password, email, phoneNum, signingUp);
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
        if (number.substring(0,2) !== "07" || number.length !== 11) {
            alert('Invalid mobile number');
            return false;
        } else return true;
    }

    $scope.callAuth = function(username, password, email, phoneNum, signingUp) {
        User.auth(username, password, email, phoneNum, signingUp).then(function() {
            $state.go('tab.home');
        }, function(error) {
            $cordovaDialogs.alert(error.message, 'Error: ' + error.code, 'Try again!');
            console.log('User.auth ' + error.message + ' Error: ' + error.code);
        });
    };

    $scope.resetPW = function(email) {
        $cordovaDialogs.alert(email, 'ResetPW', 'ToDo');
        // https://www.parse.com/docs/js/guide#users-resetting-passwords
    };

})



.controller('SettingsCtrl', function($scope, $ionicDeploy, $cordovaDialogs, $cordovaInAppBrowser, Push) {
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
        Push.now();
    };

    $scope.getAll = function() {
        cordova.plugins.notification.local.getAll(function (notifications) {
            console.info('Stragglers:', notifications);
            alert(notifications.length);
        });
    };

    $scope.pushSchedule = function(minutes) {
        if (minutes) Push.schedule(minutes);
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

})



.controller('TabsCtrl', function($scope, $state, User) {
    'use strict';

    $scope.logout = function() {
        User.destroySession();
        $state.go('splash');
    };

});