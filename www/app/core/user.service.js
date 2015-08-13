angular.module('app.core')

.factory('UserService', function($q, $localstorage) {
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