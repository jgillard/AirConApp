angular.module('AirConApp.services', ['AirConApp.utils'])

.factory('ParseService', function($q, $cordovaGeolocation) {
    var o = {
        latitude: '',
        longitude: '',
        accuracy: ''
    };

    o.savePush = function(key, value) {
        var user = Parse.User.current();
        var Status = Parse.Object.extend("Pushes");
        var status = new Status();
        status.set(key, value);
        status.set('user', user);
        var location = {lat: o.latitude, long: o.longitude, acc: o.accuracy};
        if (location.latitude == '') console.error('services:savePush location data empty');
        status.set('location', location);
        status.save(null, {
            success: function(status) {
                console.log('DATA SAVED TO PARSE: ' + key, status);
            },
            error: function(status, error) {
                console.error(error, status);
            }
        });
    };

    o.locationEnabled = function() {
        cordova.plugins.diagnostic.isLocationEnabled(function(enabled) {
            console.log("Location is " + (enabled ? "enabled" : "disabled"));
            if (!enabled) cordova.plugins.diagnostic.switchToLocationSettings();
        }, function(error){
            console.log("The following error occurred: "+error);
            alert('Locate error', 'Uh oh :S');
        });    
    };

    o.getCurrentPosition = function() {
        var defer = $q.defer();
        // 5 second timeout, 5 minute maxAge
        var posOptions = {timeout: 5000, maximumAge: 300000, enableHighAccuracy: false};
        $cordovaGeolocation.getCurrentPosition(posOptions)
            .then(function (position) {
                console.log(position);
                o.latitude = position.coords.latitude.toFixed(5);
                o.longitude = position.coords.longitude.toFixed(5);
                o.accuracy = Math.round(position.coords.accuracy);
                defer.resolve(position.coords)
            }, function(err) {
                console.error(err);
                defer.reject('Could not get your location');
            })
        ;
        return defer.promise;
    };

    return o;
})



.factory('Push', function($q) {
    var o = {};

    o.now = function() {
       cordova.plugins.notification.local.schedule({
            id: 0,
            text: 'My first notification',
            data: { key: 'value' },
            icon: 'file://img/doge.jpg',
            sound: 'file://sound/eagle.wav'
        });
    };

    o.schedule = function(minutes) {
        var scheduleTime = new Date();
        // scheduleTime.setMinutes(scheduleTime.getMinutes() + minutes);
        scheduleTime.setSeconds(scheduleTime.getSeconds() + minutes); // for development
        cordova.plugins.notification.local.schedule({
            id: 0,
            text: 'My first notification',
            firstAt: scheduleTime,
            data: { key: 'value' },
            icon: 'file://img/doge.jpg'
        });
    };

    o.multiple = function(interval, end) {
        // Cancel existing scheduling
        cordova.plugins.notification.local.cancelAll(function() {
            console.log('All previous multiple push schedules cancelled');
        }, this);
        
        // Create correct Date object from 'end' (it returns 1970)
        var endTime = new Date();
        endTime.setHours(end.getHours());
        endTime.setMinutes(end.getMinutes());

        var now = new Date();
        var nextPush = new Date(now.getTime() + interval * 60000);
        var deltaMins = Math.round((endTime - now) / 60000);
        var numPushes = Math.round(deltaMins / interval);

        console.log('Multiple Scheduling Calcs', {end: end, endGetTime: end.getTime(), endTime: endTime,
                endNewGetTime: endTime.getTime(), nowGetTime: now.getTime(), firstPush: nextPush,
                deltaMins: deltaMins, numPushes: numPushes});

        for (var i = 0; i < numPushes; i++) {
            cordova.plugins.notification.local.schedule({
                id: i,
                text: 'My repeat notification',
                // every: interval, // string only in iOS (e.g. 'minutes', 'hours')
                firstAt: nextPush,
                data: { key: 'value' },
                icon: 'file://img/doge.jpg'
            });
            nextPush.setMinutes(nextPush.getMinutes() + interval);
        }
    };

    return o;
})



.factory('Connection', function($cordovaDialogs) {
    var o = {};

    o.checkConnection = function() {
        if(window.Connection) {
            console.log('window.Connection');
            if(navigator.connection.type == Connection.NONE) {
                $cordovaDialogs.alert('Nay internet laddie.', 'Internet Disconnected')
                .then(function(result) {
                    if(!result) {
                        ionic.Platform.exitApp();
                    }
               });
            }
        }
    }
    
    return o;
})



.factory('User', function($http, $q, $localstorage) {
    var o = {
        username: false,
    };

    o.auth = function(username, password, email, number, signingUp) {
        console.log('Attempting login: ' + username, password, email, number, signingUp)
        var user = new Parse.User();
        user.set("username", username);
        user.set("password", password);
        if (signingUp) {
            user.set("email", email);
            user.set("phonenumber", phonenumber);
            return user.signUp(null, {
                success: function(user) {
                    o.setSession(username);
                    console.log('User signed up');
                } 
            });
        } else {
            return Parse.User.logIn(username, password, {
                success: function(user) {
                    console.log('User logged in');
                    o.setSession(username);
                }
            });
        }
    };

    o.setSession = function(username) {
        if (username) o.username = username;
        $localstorage.setObject('user', {username: username});
        console.log('User added to localstorage');
    };

    o.checkSession = function() {
        var defer = $q.defer();
        if (o.username) {
            defer.resolve(true);
        } else {
            var user = $localstorage.getObject('user');
            if (user.username) {
                o.setSession(user.username);
            } else {
                defer.resolve(false);
            }
        }
        return defer.promise;
    };

    o.destroySession = function() {
        Parse.User.logOut();
        $localstorage.setObject('user', {});
        o.username = false;
        console.log('User session destroyed');
    };

    return o;
});