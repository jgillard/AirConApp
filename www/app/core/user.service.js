angular.module('app.core')

.factory('UserService', function($q, $localStorage, $cordovaDialogs) {
    'use strict';

    var o = {
        username: false,
    };

    o.auth = function(username, password, email, number, signingUp) {
        console.log('Attempting login: ' + username, password, email, number, signingUp);
        var user = new Parse.User();
        user.set('username', username);
        user.set('password', password);
        if (signingUp) {
            user.set('email', email);
            user.set('phonenumber', number);
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
                            $cordovaDialogs.alert('This phone\'s number is different to the one on your account\n\nThis will be updated now')
                            .then(function(buttonIndex) {
                                if (buttonIndex === 1) {
                                    user.set('phonenumber', number);
                                    user.save().then(function() { $cordovaDialogs.alert('Phone number updated', 'Done'); });
                                }
                            });
                        }
                    }
                }
            });
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