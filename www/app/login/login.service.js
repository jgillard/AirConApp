angular.module('app.login')

.factory('LoginService', function($state, $cordovaDialogs, $ionicViewSwitcher, UserService, DebugService) {
    'use strict';

    var o = {};

    o.getSimInfoFailure = function(error, f) {
        console.log('getSimInfo ' + error);
        console.log('FailureF ' + f);
        DebugService.emailDev(JSON.stringify(error), 'login.controller:submitForm:getSimInfo');
        o.askPhoneNum();
    };

    o.getSimInfoSuccess = function(simInfo, f) {
        console.log('successF');
        console.log(simInfo.phoneNumber);
        if(simInfo.simState === 5) {
            if (o.validPhoneNum(simInfo.phoneNumber)) {
                o.callAuth(f, simInfo.phoneNumber);
            } else {
                console.log('success valid else');
                o.askPhoneNum(f);
            }
        } else {
            console.log(simInfo);
            $cordovaDialogs.alert('SIM error.', '');
        }
    };

    o.askPhoneNum = function(f) {
        console.log('askPhoneNum');
        $cordovaDialogs.prompt('Please enter this phone\'s mobile number.')
        .then(function(result) {
            if (o.validPhoneNum(result.input1)) {
                o.callAuth(f, result.input1);
            } else {
                o.askPhoneNum();
            }
        });
    };

    o.validPhoneNum = function(number) {
        console.log('validPhoneNum');
        if ((number.substring(0,2) === '07' && number.length === 11) ||
            (number.substring(0,4) === '+447' && number.length === 13)) {
            return true;
        } else {
            return false;
        }
    };

    o.callAuth = function(formInfo, phoneNum) {
        UserService.auth(formInfo, phoneNum).then(function() {
            $ionicViewSwitcher.nextDirection('forward');
            $state.go('tab.home');
        }, function(error) {
            if (error.code === 101) {
                $cordovaDialogs.alert('Invalid login details.', '');
            } else if (error.code === 203) {
                $cordovaDialogs.alert('Email address already in use.', '');
            } else {
                DebugService.emailDev(error, 'login.controller:callAuth');
                console.log('UserService.auth ' + error.message + ' Error: ' + error.code);
            }
        });
    };

    return o;

});