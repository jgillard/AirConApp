angular.module('app.core', []);

angular.module('AirConApp', ['ionic','ionic.service.core','ionic.service.deploy', 'ngCordova', 'ngStorage',
    'app.core', 'app.login', 'app.tabs', 'app.home', 'app.settings'])

.run(function($ionicPlatform, $state, $rootScope, $cordovaDialogs, $cordovaVibration, $localStorage,
        $cordovaLocalNotification, PushService, LocationService, ParseService, ConnectionService) {
    'use strict';

    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard for form inputs)
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.cordova) StatusBar.backgroundColorByHexString('#3d82a1');

        Parse.initialize('fhuSblfircn10OfsD4VPtpXQoFAH2lHFgXtu6YdL', 'cpyzcS6oynBqqBiHr3eEBGfA02AceKVJnaZAcKi5');
        Parse.User.enableRevocableSession();
        // $ionicAnalytics.register();
        $cordovaVibration.vibrate(100);

        console.info('ready');
        $localStorage.parseQueue = [];
        $rootScope.init();
    });

    $ionicPlatform.on('resume', function(){
        console.info('resume');
        $rootScope.init();
    });

    $rootScope.init = function() {
        ConnectionService.checkConnection();
        LocationService.locationEnabled();
        LocationService.getCurrentPosition();
    };

    $rootScope.$on('$cordovaLocalNotification:schedule', function (event, notification, state) {
        console.log('SCHEDULED', notification, state);
        var scheduledTime = new Date(notification.at * 1000);
        var deltat = Math.round((scheduledTime - Date.now()) / 1000);
        ParseService.savePush('pushScheduled', scheduledTime);
        $cordovaLocalNotification.getAllScheduled(function (response) {
            if (deltat > 0 && response.length == 1) {
                $cordovaDialogs.alert('Next push in ' + deltat + ' seconds', 'Success');
            }
        });
    });

    $rootScope.$on('$cordovaLocalNotification:trigger', function (event, notification, state) {
        console.log('TRIGGERED',notification, state);
        var triggeredTime = new Date();
        ParseService.savePush('pushTriggered', triggeredTime);
        if (state == 'foreground') {
            $cordovaDialogs.confirm('Acknowledge me :)', 'Push', ['Ack', 'Cancel'])
            .then(function(buttonIndex) {
                if (buttonIndex == 1) $rootScope.$emit('$cordovaLocalNotification:click', notification);
            });
        }
    });

    $rootScope.$on('$cordovaLocalNotification:click', function (event, notification, state) {
        console.log('CLICKED', notification, state, notification.id);
        PushService.acknowledge(notification);
    });

    $rootScope.$on('$cordovaLocalNotification:clear', function (event, notification, state) {
        console.log('CLEARED', notification, state);
        PushService.acknowledge(notification);
    });

});