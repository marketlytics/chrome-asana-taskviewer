angular.module('asanaChromeApp').
controller('ItemController', ['$scope', 'AsanaService', function($scope, AsanaService) {
	$scope.showDetails = false;
	$scope.asana = AsanaService;

	$scope.addStory = function(taskId) {
		var commentField = $('#comment' + taskId);
		$scope.asana.commentOnTask(taskId, commentField.val());
		commentField.val('');
	};

	$scope.expandTasks = function(taskId) {
		$scope.$parent.expandContext(taskId);
	}

	$scope.toggle = function(taskId) {
		$scope.asana.fetchTaskDetails(taskId);
		if($scope.showDetails) $scope.showDetails = false;
		else $scope.showDetails = true;
	};

	// TODO: Extend as date object
	var convertStringToDate = function(dateString) {
		if(!dateString) 
			return false;

		//2014-11-17
		var dateComps = dateString.split('-');
		if(dateComps.length !== 3) 
			return false;

		//new Date(year, month, day, hours, minutes, seconds, milliseconds);
		return new Date(dateComps[0], parseInt(dateComps[1]) - 1, dateComps[2], 0, 0, 0, 0, 0);
	};

	$scope.hasDeadlinePassed = function(deadline) {
		var date = convertStringToDate(deadline);
		if(!date)
			return false;

		if(date.getTime() > (new Date()).getTime()) 
			return false;

		return true;
	};

	$scope.isDeadlineUpcoming = function(deadline) {
		var date = convertStringToDate(deadline);
		if(!date)
			return false;

		var diff = (date.getTime() - (new Date()).getTime());
		if(diff > 0 && diff < 86400000) 
			return true;

		return false;
	}


}]);