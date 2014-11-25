/*
	Converts the assignee id into the user name initals
*/

angular.module('asanaChromeApp').
filter('assignee', function() {
  return function(assignee, team) {
  	if(assignee != null) {
	    for(var x = 0; x < team.length; x++) {
	    	var member = team[x];
	    	if(member.id == assignee.id) {
	    		var namePieces = member.name.split(' ');
	    		var initials = '';
	    		for(var index in namePieces) {
	    			var word = namePieces[index];
	    			initials += word[0];
	    		}
	    		return initials.substring(0,2);
	    	}
	    }
    }
    return "";
  };
});
