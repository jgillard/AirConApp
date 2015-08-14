angular.module('app.core', []);

angular.module('AirConApp', ['ionic','ionic.service.core','ionic.service.deploy', 'ngCordova',
    'app.core', 'app.login', 'app.tabs', 'app.home', 'app.settings'])

.run(function($ionicPlatform, $state, $rootScope, $cordovaDialogs, $cordovaVibration,
        $cordovaLocalNotification, $cordovaStatusbar, UserService, PushService, LocationService, ParseService, ConnectionService) {
    'use strict';

    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard for form inputs)
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.cordova) StatusBar.backgroundColorByHexString('#3d82a1');

        Parse.initialize(config.PARSE_APPLICATION_ID, config.PARSE_JAVASCRIPT_KEY);
        Parse.User.enableRevocableSession();
        // $ionicAnalytics.register();
        $cordovaVibration.vibrate(100);

        console.info('ready');
        ConnectionService.checkConnection();
        LocationService.locationEnabled();
        LocationService.getCurrentPosition(10000);
    });

    $ionicPlatform.on('resume', function(){
        console.info('resume');
        ConnectionService.checkConnection();
        LocationService.locationEnabled();
        LocationService.getCurrentPosition();
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
        console.log('pushData:', pushData);
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
                     $cordovaDialogs.confirm('Schedule more if necessary', 'That was the last one');
                }
            });
        }
    };

})

.config(function($stateProvider, $urlRouterProvider) {
    'use strict';
    $stateProvider

    // setup an abstract state for the tabs directive
    .state('tab', {
        url: '/tab',
        abstract: true,
        templateUrl: 'app/core/tabs.html',
        controller: 'TabsCtrl',
        // resolve: {
        //     populateSession: function(UserService) {
        //         return UserService.checkSession();
        //     }
        // },
        onEnter: function($state, UserService) {
            UserService.checkSession().then(function(hasSession) {
                if (!hasSession) $state.go('login');
            });
        }
    })

    .state('tab.home', {
        url: '/home',
        views: {
            'tab-home': {
                templateUrl: 'app/home/home.html',
                controller: 'HomeCtrl'
            }
        }
    })

    .state('tab.settings', {
        url: '/settings',
        views: {
            'tab-settings': {
                templateUrl: 'app/settings/settings.html',
                controller: 'SettingsCtrl'
            }
        }
    })

    .state('login', {
        url: '/',
        templateUrl: 'app/login/login.html',
        controller: 'LoginCtrl'
        // onEnter: function($state, UserService) {
        //     UserService.checkSession().then(function(hasSession) {
        //         if (hasSession) $state.go('tab.home');
        //     })
        // }
    });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/');
});