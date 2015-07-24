/*
	Converts the assignee id into the user name initals
*/

angular.module('asanaChromeApp').
filter('nameWithTeam', function() {
    "use strict";
    return function(project) {
        if(project.team) {
            return project.name + ' < ' + project.team.name;
        }
    	return project.name;
    };
});
