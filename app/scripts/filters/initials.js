/*
	Converts the assignee id into the user name initals
*/

angular.module('asanaChromeApp').
filter('initials', function() {
  return function(name) {
  	if(typeof name !== 'undefined' && name.length > 0) {
  		var namePieces = name.split(' ');
		var initials = '';
		for(var index in namePieces) {
			var word = namePieces[index];
			initials += word[0];
		}
		return initials.substring(0,2);
  	}
  	
    return "";
  };
});
