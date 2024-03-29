angular.module('app.core')

.factory('UserService', function($q, $localStorage, $cordovaDialogs) {
    'use strict';

    var o = {
        username: false,
    };

    o.auth = function(f, number) {
        console.log('Attempting login: ' + f.username, f.password, f.email, number, f.signingUp);
        var user = new Parse.User();
        user.set('username', f.username);
        user.set('password', f.password);
        if (f.signingUp) {
            user.set('email', f.email);
            user.set('phonenumber', f.number);
            if (window.cordova) user.set('uuid', window.device.uuid);
            return user.signUp(null, {
                success: function(user) {
                    o.setSession(f.username);
                    console.log('User signed up');
                }
            });
        } else {
            return Parse.User.logIn(f.username, f.password, {
                success: function(user) {
                    console.log('User logged in');
                    o.setSession(f.username);
                    o.checkPhone(user, number);
                }
            });
        }
    };

    o.checkPhone = function(user, number) {
        // Detect different phone number to what Parse knows, and update it.
        if (window.plugins) {
            var savedNumber = user.attributes.phonenumber;
            if (number.substring(0,3) === '+44') {
                number = number.replace('+44', '0');
            }
            if (savedNumber.substring(0,3) === '+44') {
                savedNumber = savedNumber.replace('+44', '0');
            }
            if (number !== savedNumber) {
                console.log('savedNum:', savedNumber, 'newNum:', number);
                $cordovaDialogs.alert('This phone\'s number is different to the one on your account.', '', 'update now')
                .then(function() {
                    console.log('updating phone number');
                    user.set('phonenumber', number);
                    user.set('uuid', window.device.uuid);
                    user.save().then(function() {
                        $cordovaDialogs.alert('Phone number stored.', '');
                    });
                });
            }
        }
    };

    o.setSession = function(username) {
        if (username) o.username = username;
        $localStorage.user = {username: username};
        console.log('User added to localstorage');
    };

    o.checkSession = function() {
        var defer = $q.defer();
        if (o.username) {
            defer.resolve(true);
        } else {
            var user = $localStorage.user;
            if (user) {
                if (user.username) {
                    o.setSession(user.username);
                    defer.resolve(true);
                }
            } else {
                defer.resolve(false);
            }
        }
        return defer.promise;
    };

    o.destroySession = function() {
        Parse.User.logOut();
        $localStorage.user = {};
        o.username = false;
        console.log('User session destroyed');
    };

    return o;
});