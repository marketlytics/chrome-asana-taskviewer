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
}]);