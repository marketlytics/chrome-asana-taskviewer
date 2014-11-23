angular.module('asanaChromeApp').controller('MainController', ['$scope','AsanaService', '$http', function($scope, AsanaService, $http) {
	$scope.asana = AsanaService;
	$scope.taskFilterCompleted = 'all';
	$scope.taskFilter = {};

	$scope.taskContext = [];
	$scope.contextText = "";
	$scope.tasks = [];

	$scope.interval = null;

	// really ugly, need to use promises!
	getValue('taskContext', function(valForContext) {
		if(typeof valForContext.taskContext !== 'undefined') {
			$scope.taskContext = valForContext.taskContext;
		}

		getValue('contextText', function(valForText) {
			if(typeof valForText.contextText !== 'undefined') {
				$scope.contextText = valForText.contextText;
			}

			getValue('apiKey', function(valForKey) {
				if(typeof valForKey.apiKey !== 'undefined') {
					$scope.apiKey = valForKey.apiKey;
					$scope.asana.init(valForKey.apiKey, $scope);
				}
			});
		});
	});

	
	var setTaskWithContext = function(taskId) {
		var task = $scope.asana.findTask(taskId);
		if($scope.taskContext.length <= 0 || task === null) {
			$scope.tasks = $scope.asana.tasks;
		} else {
			$scope.contextText = task.name;
			$scope.tasks = task.subtasks;	
		}

		storeValue('taskContext', $scope.taskContext);
		storeValue('contextText', $scope.contextText);
	}

	$scope.$watch('asana.tasks', function() {
		if($scope.taskContext.length > 0) {
			setTaskWithContext($scope.taskContext[$scope.taskContext.length - 1]);
		} else {
			setTaskWithContext(null);
		}
	});

	// refines the task scope to taskId sent
	$scope.expandContext = function(taskId) {
		$scope.taskContext.push(taskId);
		setTaskWithContext(taskId);
	};

	// reduces the scope to the parent, or toplevel
	$scope.reduceContext = function() {
		$scope.taskContext.pop();
		setTaskWithContext($scope.taskContext[$scope.taskContext.length - 1]);
	};

	$scope.saveApiKey = function(apiKey) {
		if(apiKey !== '') {
			storeValue('apiKey', apiKey, function() {
				console.log('APIKey updated.')
			});
		}
	};

	getValue('taskFilter', function(value) {
		if(typeof value.taskFilter !== 'undefined') {
			$scope.taskFilter = value.taskFilter;
			if(typeof value.taskFilter.completed !== 'undefined') {
				if(value.taskFilter.completed) 
					$scope.taskFilterCompleted = 'completed';
				else
					$scope.taskFilterCompleted = 'todo';
			}
		}
	});

	$scope.adjustFilter = function() {
		if($scope.taskFilterCompleted === 'todo') {
			$scope.taskFilter['completed'] = false;
		} else if($scope.taskFilterCompleted === 'completed') {
			$scope.taskFilter['completed'] = true;
		} else if($scope.taskFilterCompleted === 'all') {
			delete $scope.taskFilter['completed'];
		}

		if($scope.taskFilterAssigned == 0) {
			delete $scope.taskFilter['assignee'];
		} else {
			$scope.asana.selectUser($scope.taskFilterAssigned);
			$scope.taskFilter['assignee'] = $scope.taskFilterAssigned;
		}

		storeValue('taskFilter', $scope.taskFilter);
	}

}]);