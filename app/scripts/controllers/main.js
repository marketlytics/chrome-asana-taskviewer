angular.module('asanaChromeApp').controller('MainController', ['$scope','AsanaService', '$http', function($scope, AsanaService, $http) {
	$scope.asana = AsanaService;
	$scope.taskFilterCompleted = 'all';
	$scope.taskFilter = {};

	$scope.taskContext = [];
	$scope.contextText = "";
	$scope.tasks = [];

	$scope.intervalTime = 1000 * 60 * 5; // 5 minutes
	$scope.lastRefresh = (new Date()).getTime();

	var intervalCallback = function(data) {
		if(data.length > 0) {
			var message = '';

			for(var x = 0; x < data.length; x++) {
				var obj = data[x];
				message += '- ' + obj.name + '\n';
			}

			chrome.notifications.create('updatedTasks', {
				iconUrl: 'images/icon-16.png', // icon needs to be 64 x 64
				type: 'basic', // needs to be of type list
				title: 'The following (' + data.length +') tasks have been updated',
				isClickable: false,
				message: message
			}, function() {});
		}
	};

	$scope.interval = setInterval(function() {
		var date = new Date($scope.lastRefresh)
		$scope.asana.autoRefresh(date.toISOString(), intervalCallback);
		$scope.lastRefresh = (new Date()).getTime();
		storeValue('lastRefresh', $scope.lastRefresh);
	}, $scope.intervalTime);

	/*
		Get stuff from localstorage
	*/
	getValue('lastRefresh', function(value) {
		if(typeof value.lastRefresh !== 'undefined') {
			$scope.lastRefresh = value.lastRefresh;
		}
	});

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

	/*
		Setup your private functions
	*/

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

	var watchers = []; // used to watch over subtask changes esp for refresh.
	// refines the task scope to taskId sent
	$scope.expandContext = function(taskId) {
		$scope.taskContext.push(taskId);
		watchers.push($scope.$watchCollection(function() {
			return $scope.asana.findTask(taskId);
		}, function() {
			setTaskWithContext(taskId);
		}));
	};

	// reduces the scope to the parent, or toplevel
	$scope.reduceContext = function() {
		$scope.taskContext.pop();
		(watchers.pop())(); // remove the watcher since its no longer getting observed
		setTaskWithContext($scope.taskContext[$scope.taskContext.length - 1]);
	};

	var resetContext = function() {
		for(var indexW in watchers) {
			var watcher = watchers[indexW];
			watcher(); // unwatch it
		}
		
		$scope.taskContext = [];
		$scope.contextText = '';		
		setTaskWithContext(null);
	};

	$scope.refresh = function() {
		if($scope.taskContext.length > 0) {
			$scope.asana.fetchTaskDetails($scope.taskContext[$scope.taskContext.length - 1], true);	
		} else {
			$scope.asana.refresh(false);
		}
	};

	$scope.changeWorkspace = function(workspace) {
		resetContext();
		$scope.asana.selectWorkspace(workspace);
	}

	$scope.changeProject = function(project) {
		resetContext();
		$scope.asana.selectProject(project);
	}

	$scope.saveApiKey = function(apiKey) {
		if(apiKey !== '') {
			storeValue('apiKey', apiKey, function() {
				console.log('APIKey updated.')
			});
		}
	};

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