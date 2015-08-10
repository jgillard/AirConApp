angular.module('AirConApp', ['ionic','ionic.service.core','ionic.service.deploy', 'ngCordova', 'AirConApp.controllers', 'AirConApp.services'])

.run(function($ionicPlatform, $state, $rootScope, $cordovaDialogs, $cordovaVibration,
        $cordovaLocalNotification, $cordovaStatusbar, User, Push, ParseService, Connection) {
    'use strict';
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard for form inputs)
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.cordova) StatusBar.backgroundColorByHexString('#455A64');

        Parse.initialize(config.PARSE_APPLICATION_ID, config.PARSE_JAVASCRIPT_KEY);
        Parse.User.enableRevocableSession();
        // $ionicAnalytics.register();
        Connection.checkConnection();
        $cordovaVibration.vibrate(100);

        $ionicPlatform.on('resume', function(){
            console.info('resume');
            Connection.checkConnection();
            ParseService.getCurrentPosition();
        });
    });


    $rootScope.$on('$cordovaLocalNotification:schedule', function (event, notification, state) {
        console.log('SCHEDULED', notification, state);
        var scheduledTime = new Date(notification.at * 1000);
        var deltat = Math.round((scheduledTime - Date.now()) / 1000);
        ParseService.getCurrentPosition().then(function() {
            ParseService.savePush('pushScheduled', scheduledTime);
        });
        $cordovaLocalNotification.getAllScheduled(function (response) {
            if (deltat > 0 && response.length == 1) {
                $cordovaDialogs.alert('Next push in ' + deltat + ' seconds', 'Success');
            }
        });
    });

    $rootScope.$on('$cordovaLocalNotification:trigger', function (event, notification, state) {
        console.log('TRIGGERED',notification, state);
        var triggeredTime = new Date();
        ParseService.getCurrentPosition().then(function() {
            ParseService.savePush('pushTriggered', triggeredTime);
        });
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
        ParseService.getCurrentPosition().then(function() {
            var acknowledgedTime = new Date();
            ParseService.savePush('pushAcknowledged', acknowledgedTime);
            $cordovaLocalNotification.clearAll();
            var pushData = eval('(' + notification.data + ')');
            console.log('pushData:', pushData);
            // Branch based on what function scheduled th notification
            if (pushData.func != 'multiple') {
                // For single pushes ask for a repeat
                $cordovaDialogs.confirm('The same again sir?', 'Your Highness', ['YAY', 'NAY'])
                .then(function(buttonIndex) {
                    if (buttonIndex == 1) {
                        if (pushData.func == 'now') Push.now();
                        else if (pushData.func == 'schedule') Push.schedule(pushData.minutes);
                        else alert('Dev screwed up...');
                    }
                });
            } else {
                // For queued pushes, wait until none left
                cordova.plugins.notification.local.getAllScheduled(function (response) {
                    if (response === 'undefined' || response.length === 0) {
                         $cordovaDialogs.confirm('Schedule more if necessary', 'That was the last one');
                    }
                });
            }
        });
    };

})

.config(function($stateProvider, $urlRouterProvider) {
    'use strict';
    $stateProvider

    // setup an abstract state for the tabs directive
    .state('tab', {
        url: '/tab',
        abstract: true,
        templateUrl: 'templates/tabs.html',
        controller: 'TabsCtrl',
        // resolve: {
        //     populateSession: function(User) {
        //         return User.checkSession();
        //     }
        // },
        onEnter: function($state, User) {
            User.checkSession().then(function(hasSession) {
                if (!hasSession) $state.go('splash');
            });
        }
    })

    .state('tab.home', {
        url: '/home',
        views: {
            'tab-home': {
                templateUrl: 'templates/home.html',
                controller: 'HomeCtrl'
            }
        }
    })

    .state('tab.settings', {
        url: '/settings',
        views: {
            'tab-settings': {
                templateUrl: 'templates/settings.html',
                controller: 'SettingsCtrl'
            }
        }
    })

    .state('splash', {
        url: '/',
        templateUrl: 'templates/splash.html',
        controller: 'SplashCtrl'
        // onEnter: function($state, User) {
        //     User.checkSession().then(function(hasSession) {
        //         if (hasSession) $state.go('tab.home');
        //     })
        // }
    });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/');
});