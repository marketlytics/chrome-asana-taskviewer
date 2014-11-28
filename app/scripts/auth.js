$(document).ready(function() {
	$('#save').click(function() {
		var value = $('#apiKey').val();
		if(value === '') return;

		tracker.sendEvent('app', 'apiKeySubmit');
		storeValue('apiKey', value, function() {
			window.close();
		});

	})
	window.tracker.sendAppView('AuthView');
});