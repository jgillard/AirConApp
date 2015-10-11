'use strict';

Parse.Cloud.job('userMonitor', function(request, status) {
    var queryCallbacks = require('cloud/queryCallbacks.js');
    var moment = require('cloud/moment-timezone-with-data-2010-2020.js');
    var today = moment().startOf('day');

    // Get all of today's pushes
    var Pushes = Parse.Object.extend('Pushes');
    var query = new Parse.Query(Pushes);
    query.greaterThanOrEqualTo('createdAt', today.toDate());
    query.find({
        success: function(results) {
            queryCallbacks.pushQuerySuccess(results);
        },
        error: function(error) {
            console.log('QUERY.FIND ERROR');
            console.log(error);
        }
    }).then(function() {
        //status.success('User Monitor completed successfully.');
    }, function(error) {
        console.log(error);
        //status.error('User Monitor failed spectacularly!');
    });
});