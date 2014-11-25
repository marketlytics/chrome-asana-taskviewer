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
			var items = [];
			for(var x = 0; x < data.length; x++) {
				var obj = data[x];
				items.push({ title: obj.name, message: '' });
			}

			chrome.notifications.create('updatedTasks', {
				iconUrl: 'images/icon-64.png',
				type: 'list',
				title: data.length + ' task(s) have been updated',
				message: '',
				isClickable: false,
				items: items
			}, function() {});
		}
	};

	$scope.interval = setInterval(function() {
		var date = new Date($scope.lastRefresh)
		AsanaService.autoRefresh(date.toISOString(), intervalCallback);
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
					AsanaService.init(valForKey.apiKey, $scope);
				} else {
					Bugsnag.notify("AsanaError", "API Key was undefined. Unable to init.");
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
		var task = AsanaService.findTask(taskId);
		if($scope.taskContext.length <= 0 || task === null) {
			$scope.tasks = AsanaService.tasks;
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
		tracker.sendEvent('task', 'subtask-drill-down', $scope.taskContext.length);
		$scope.taskContext.push(taskId);
		watchers.push($scope.$watchCollection(function() {
			return AsanaService.findTask(taskId);
		}, function() {
			setTaskWithContext(taskId);
		}));
	};

	// reduces the scope to the parent, or toplevel
	$scope.reduceContext = function() {
		tracker.sendEvent('task', 'subtask-move-up', $scope.taskContext.length);
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
		tracker.sendEvent('app', 'refresh');
		if($scope.taskContext.length > 0) {
			AsanaService.fetchTaskDetails($scope.taskContext[$scope.taskContext.length - 1], true);	
		} else {
			AsanaService.refresh(false);
		}
	};

	$scope.changeWorkspace = function(workspace) {
		tracker.sendEvent('app', 'changeWorkspace');
		resetContext();
		AsanaService.selectWorkspace(workspace);
	}

	$scope.changeProject = function(project) {
		tracker.sendEvent('app', 'changeProject');
		resetContext();
		AsanaService.selectProject(project);
	}

	$scope.saveApiKey = function(apiKey) {
		tracker.sendEvent('app', 'updateAPIKey');
		if(apiKey !== '') {
			storeValue('apiKey', apiKey, function() {
				console.log('APIKey updated.')
			});
		}
	};

	$scope.adjustFilter = function() {
		tracker.sendEvent('app', 'adjustFilter');
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
			AsanaService.selectUser($scope.taskFilterAssigned);
			$scope.taskFilter['assignee'] = $scope.taskFilterAssigned;
		}

		storeValue('taskFilter', $scope.taskFilter);
	}

}]);