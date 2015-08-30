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
        ConnectionService.checkConnection();
        LocationService.locationEnabled();
        LocationService.bgGeolocStart();
    });

    $ionicPlatform.on('resume', function(){
        console.info('resume');
        ConnectionService.checkConnection();
        LocationService.locationEnabled();
    });

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
        $rootScope.acknowledge(notification);
    });

    $rootScope.$on('$cordovaLocalNotification:clear', function (event, notification, state) {
        console.log('CLEARED', notification, state);
        $rootScope.acknowledge(notification);
    });

    $rootScope.acknowledge = function(notification) {
        var acknowledgedTime = new Date();
        ParseService.savePush('pushAcknowledged', acknowledgedTime);
        $cordovaLocalNotification.clearAll();
        var pushData = eval('(' + notification.data + ')');
        // Branch based on what function scheduled th notification
        if (pushData.func != 'multiple') {
            // For single pushes ask for a repeat
            $cordovaDialogs.confirm('The same again?', 'Nice one!', ['YAY', 'NAY'])
            .then(function(buttonIndex) {
                if (buttonIndex == 1) {
                    if (pushData.func == 'now') PushService.now();
                    else if (pushData.func == 'schedule') PushService.schedule(pushData.minutes);
                    else alert('Dev screwed up...');
                }
            });
        } else {
            // For queued pushes, wait until none left
            cordova.plugins.notification.local.getAllScheduled(function (response) {
                if (response === 'undefined' || response.length === 0) {
                     $cordovaDialogs.alert('That was the last one. Schedule more if necessary');
                }
            });
        }
    };

});