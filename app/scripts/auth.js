$(document).ready(function() {
	$('#save').click(function() {
		var value = $('#apiKey').val();
		if(value === '') return;

		storeValue('apiKey', value, function() {
			window.close();
		});

	})
});