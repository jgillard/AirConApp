'use strict';

Parse.Cloud.define('sendSMS', function(request, response) {

	console.log(request.params);

	Parse.Config.get().then(function(config) {

		var client = require('twilio')(config.get('TWILIO_ACCOUNT_SID'),
									   config.get('TWILIO_AUTH_TOKEN'));

		console.log(request.params);

		client.sendSms({
		    to: request.params.to,
		    from: '+441613751791',
		    body: request.params.message
		}, function(err, responseData) {
		    if (err) {
		        console.log(err);
		        response.error(err);
		    } else {
		        console.log(responseData.from);
		        console.log(responseData.body);
		        response.success(responseData);
		    }
		});
	});
});