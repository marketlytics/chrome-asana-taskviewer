angular.module('asanaChromeApp').
controller('ItemController', ['$scope', 'AsanaService', function($scope, AsanaService) {
	'use strict';

	$scope.showDetails = false;
	$scope.asana = AsanaService;
	$scope.storyLimit = 3;

	$scope.addStory = function(taskId) {
		tracker.sendEvent('task', 'item', 'commented');
		var commentField = $('#comment' + taskId);
		$scope.asana.commentOnTask(taskId, commentField.val());
		commentField.val('');
	};

	$scope.selectFile = function(taskId) {
		$('#file' + taskId).click().change(function() {
			var files = this.files;
			var formData = new FormData();

			for(var x = 0; x < files.length; x++) {
				formData.append('file', files[x]);
			}

			$scope.asana.addAttachmentToTask(taskId, formData);
		});
	}

	$scope.expandTasks = function(taskId) {

		$scope.$parent.expandContext(taskId);
	}

	// TODO: Extend as date object
	var convertStringToDate = function(dateString, timeString) {
		if(timeString)
			return new Date(timeString);

		if(!dateString)
			return false;

		//2014-11-17
		var dateComps = dateString.split('-');
		if(dateComps.length !== 3)
			return false;

		//new Date(year, month, day, hours, minutes, seconds, milliseconds);
		return new Date(dateComps[0], parseInt(dateComps[1]) - 1, dateComps[2], 0, 0, 0, 0, 0);
	};

	$scope.hasDeadlinePassed = function(dueOn, dueAt) {
		var date = convertStringToDate(dueOn, dueAt);
		if(!date)
			return false;

		return date.getTime() < (new Date()).getTime();
	};

	$scope.isDeadlineUpcoming = function(dueOn, dueAt) {
		var date = convertStringToDate(dueOn, dueAt);
		if(!date)
			return false;

		var diff = (date.getTime() - (new Date()).getTime());
		return (diff > 0 && diff < 86400000) || (diff < 0 && diff > -86399999);
	}


	$scope.isHeading = function(heading) {
		return heading.match(/:$/g) !== null;
	};


}]);
