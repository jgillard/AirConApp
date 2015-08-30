angular.module('AirConApp')

.config(function($stateProvider, $urlRouterProvider) {
    'use strict';
    $stateProvider

    // setup an abstract state for the tabs directive
    .state('tab', {
        url: '/tab',
        abstract: true,
        templateUrl: 'app/tabs/tabs.html',
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