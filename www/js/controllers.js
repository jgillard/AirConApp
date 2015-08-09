angular.module('AirConApp.controllers', ['ionic', 'ionic.service.deploy', 'AirConApp.services'])


.controller('HomeCtrl', function($scope, $timeout, $http, $cordovaLocalNotification, 
            $cordovaGeolocation, $ionicLoading, $cordovaDialogs, $ionicPlatform, 
            User, Push, ParseService) {
    
    $scope.username = User.username;
    $scope.gotLoc = false;

    // Defaults for development
    $scope.localMinutes = 5;


    $scope.init = function() {
        console.log('HomeCtrl scope.init getCurrentPosition');
        $scope.getCurrentPosition();
    };

    /* PUSH NOTIFICATION STUFF */

    $scope.pushNow = function() {
        Push.now()
    };

    $scope.pushSchedule = function(minutes) {
        if (minutes) Push.schedule(minutes);
        else $cordovaDialogs.alert('Set the time interval', 'Heads Up');
    };

    $scope.pushMultiple = function(interval, end) {
        if (interval && end) Push.multiple(interval, end);
        else $cordovaDialogs.alert('You missed something', 'Heads Up');

    };
 
    $scope.isScheduled = function() { 
        var scheduleTime;
        // Only deals with single scheduled push (deal with multiple and zero)
        cordova.plugins.notification.local.getAllScheduled(function (response) {
            var now = Date.now();
            if (!response[0]) $cordovaDialogs.alert('No pushes scheduled', 'Nope!');
            else {
                var deltat = Math.round(response[0].at - now / 1000);
                console.log(response.length + ' push(es) scheduled for ' + deltat + ' seconds time!');
                $cordovaDialogs.alert(response.length + ' push(es) scheduled for ' + deltat + ' seconds time!', 'Heads Up');
            }      
        });
    };

    $scope.cancelAll = function() { 
        cordova.plugins.notification.local.cancelAll(function() {
            $cordovaDialogs.alert('Thank fuck');
        }, this);
    };

    $scope.getAll = function() {
        cordova.plugins.notification.local.getAll(function (notifications) {
            console.info('Stragglers:', notifications);
        });
    }

    /* GEOLOCATION STUFF */

    $scope.locate = function() {
        console.log('Attempting to get location');
        $scope.showLocating();
        // First check phone location status
        ParseService.locationEnabled();
        $scope.getCurrentPosition();
    };

    $scope.getCurrentPosition = function() {
        ParseService.getCurrentPosition().then(function(coords) {
            $scope.hideLocating();
            if (coords.accuracy > 100) console.log('Location Accuracy Poor');
            $scope.gotLoc = true;
        }, function(message) {
            $scope.hideLocating();
            $cordovaDialogs.alert('getCurrentPos error:' + message, 'Uh oh :S');
        });
    }

    $scope.showLocating = function() {
        $ionicLoading.show({
            template: 'Getting your location...',
            delay: 500
        });
    };

    $scope.hideLocating = function(){
        $ionicLoading.hide();
    };

    $scope.init();
})



.controller('SplashCtrl', function($scope, $state, $cordovaDialogs, $ionicModal, User) {
    
    // Defaults for development
    $scope.username = 'James';
    $scope.password = 'James';

    $scope.submitForm = function(username, password, email, signingUp) {
        // Logout existing user session
        var currentUser = Parse.User.current();
        if (currentUser) Parse.destroySession;

        window.plugins.phonenumber.get(function(phoneNum) {
            console.log('phoneNum: ' + phoneNum);
            $scope.callAuth(username, password, email, phoneNum, signingUp);
        }, function(error) {
            console.log(error);
            if (signingUp) {
                $cordovaDialogs.prompt('Please enter this phone\'s number', error, ['Submit'])
                .then(function(result) {
                    $scope.callAuth(username, password, email, result.input1, signingUp);
                });
            } else {
                $scope.callAuth(username, password, email, undefined, signingUp);
            }
            
        });
    };

    $scope.callAuth = function(username, password, email, phoneNum, signingUp) {
        User.auth(username, password, email, phoneNum, signingUp).then(function() {
            $state.go('tab.home');
        }, function(error) {
            $cordovaDialogs.alert(error.message, 'Error: ' + error.code, 'Try again!');
            console.log('User.auth ' + error.message + ' Error: ' + error.code);
        })
    };

    $scope.resetPW = function(email) {
        $cordovaDialogs.alert('message', 'title', 'button name')
        // https://www.parse.com/docs/js/guide#users-resetting-passwords
    };

    /* RICK ASTLEY STUFF */

    $ionicModal.fromTemplateUrl('my-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal = modal;
    });
    $scope.openModal = function() {
        $scope.modal.show();
        setTimeout($scope.closeModal, 30000);
    };
    $scope.closeModal = function() {
        $scope.modal.hide();
    };

})



.controller('TabsCtrl', function($scope, $window, $ionicDeploy, $cordovaDialogs, User) {

    $scope.logout = function() {
        User.destroySession();
        $window.location.href = 'index.html';
    };

    // IONIC.IO DEPLOY CODE
    // Update app code with new release from Ionic Deploy
    $scope.doUpdate = function() {
        if (!hasUpdate) $cordovaDialogs.alert('No update available', 'Heads Up');
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

    // Check Ionic Deploy for new code
    $scope.checkForUpdates = function() {
        console.log('Ionic Deploy: Checking for updates');
        $ionicDeploy.check().then(function(hasUpdate) {
            console.log('Ionic Deploy: Update available: ' + hasUpdate);
            $scope.hasUpdate = hasUpdate;
            $cordovaDialogs.alert('No update available', 'Heads Up');
        }, function(err) {
            console.error('Ionic Deploy: Unable to check for updates', err);
            $cordovaDialogs.alert('Error occurred', 'Heads Up');
        });
    }
});    