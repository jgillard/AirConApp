angular.module('app.core', []);

angular.module('AirConApp', ['ionic', 'ngCordova', 'ngStorage',
    'app.core', 'app.login', 'app.tabs', 'app.home', 'app.settings'])

.run(function($ionicPlatform, $rootScope, $cordovaDialogs, $cordovaVibration, $localStorage,
        $cordovaLocalNotification, PushService, LocationService, ParseService) {
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
        $cordovaVibration.vibrate(100);

        console.info('ready');
        $localStorage.parseQueue = [];
        $localStorage.pushQueue = [];
        $rootScope.init();
    });

    $ionicPlatform.on('resume', function(){
        console.info('resume');
        $rootScope.init();
    });

    $rootScope.init = function() {
        LocationService.locationEnabled();
        LocationService.getCurrentPosition();
    };

    $rootScope.$on('$cordovaLocalNotification:schedule', function (event, notification, state) {
        console.log('SCHEDULED', notification, state);
        var scheduledTime = new Date(notification.at * 1000);
        ParseService.savePush('pushScheduled', scheduledTime);
    });

    $rootScope.$on('$cordovaLocalNotification:trigger', function (event, notification, state) {
        console.log('TRIGGERED',notification, state);
        if($localStorage.pushQueue.length > 0) {
            $cordovaLocalNotification.schedule($localStorage.pushQueue.shift());
        }
        var triggeredTime = new Date();
        ParseService.savePush('pushTriggered', triggeredTime);
        // if (state == 'foreground') {
        //     $cordovaDialogs.alert('Send acknowledgement.', '', 'Ack')
        //     .then(function() {
        //         $rootScope.$emit('$cordovaLocalNotification:click', notification);
        //     });
        // }
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