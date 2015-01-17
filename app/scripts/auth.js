$(document).ready(function() {
	$('#save').click(function() {
		var value = $('#apiKey').val();
		if(value === '') return;

		var generatedId = (new Date()).getTime() + '' + (Math.random() * 19);

		tracker.set('userId', generatedId);
		var userDimensionTracking = analytics.EventBuilder.builder()
		.category('app')
		.action('apiKeySubmit')
		.dimension(2, generatedId);
		tracker.send(userDimensionTracking.label(generatedId));

		storeValue('apiKey', value, function() {
			window.close();
		});

	})
	tracker.sendAppView('AuthView');
});
