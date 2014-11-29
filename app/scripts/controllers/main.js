angular.module('asanaChromeApp').controller('MainController', ['$scope','AsanaService', '$http', 'notify', function($scope, AsanaService, $http, notify) {
	$scope.asana = AsanaService;

	$scope.userPrefs = {
		taskFilterCompleted: 'all',
		taskFilterAssigned: 0,
		taskFilter: {},
		taskContext: [],
		contextText: "",
		lastRefresh: (new Date()).getTime(),
		apiKey: "",
		selectedProject: null,
		selectedWorkspace: null,

	};

	$scope.tasks = [];
	$scope.intervalTime = 1000 * 60 * 5; // 5 minutes

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

	// Get stuff from localstorage and initalize the application
	getValue('userPrefs', function(value) {
		console.log('Fetched from localstorage', value.userPrefs);
		if(typeof value.userPrefs !== 'undefined') {
			$scope.userPrefs = value.userPrefs;

			// configure the apiKey 
			if(typeof value.userPrefs.apiKey !== 'undefined') {
				AsanaService.init(value.userPrefs.apiKey, $scope);
			} else {
				tracker.sendEvent('app', 'error', 'API Key not defined.');
				notify({ message:'API Key is not defined, please configure it from settings.', classes: 'alert-custom' } );
			}

			// configure the filters
			if(typeof value.userPrefs.taskFilter !== 'undefined') {
				if(typeof value.userPrefs.taskFilter.completed !== 'undefined') {
					if(value.userPrefs.taskFilter.completed) 
						$scope.userPrefs.taskFilterCompleted = 'completed';
					else
						$scope.userPrefs.taskFilterCompleted = 'todo';
				}
			}
		}
	});

	//Setup your private function
	var watchers = []; // used to watch over subtask changes esp for refresh.
	
	var setTaskWithContext = function(taskId) {
		var task = AsanaService.findTask(taskId);
		if($scope.userPrefs.taskContext.length <= 0 || task === null) {
			$scope.tasks = AsanaService.tasks;
		} else {
			$scope.userPrefs.contextText = task.name;
			$scope.tasks = task.subtasks;	
		}

		savePrefs();
	}

	var savePrefs = function() {
		storeValue('userPrefs', $scope.userPrefs);
	};

	// configure watchers
	$scope.$watch('asana.tasks', function() {
		if($scope.userPrefs.taskContext.length > 0) {
			setTaskWithContext($scope.userPrefs.taskContext[$scope.taskContext.length - 1]);
		} else {
			setTaskWithContext(null);
		}
	});


	// Controller methods
	// refines the task scope to taskId sent
	$scope.expandContext = function(taskId) {
		tracker.sendEvent('task', 'subtask-drill-down', $scope.userPrefs.taskContext.length);
		$scope.userPrefs.taskContext.push(taskId);

		// so as to update the tasks if anything changes
		watchers.push($scope.$watchCollection(function() {
			return AsanaService.findTask(taskId);
		}, function() {
			setTaskWithContext(taskId);
		}));
	};

	// reduces the scope to the parent, or toplevel
	$scope.reduceContext = function() {
		tracker.sendEvent('task', 'subtask-move-up', $scope.userPrefs.taskContext.length);
		$scope.userPrefs.taskContext.pop();
		(watchers.pop())(); // remove the watcher since its no longer getting observed
		setTaskWithContext($scope.userPrefs.taskContext[$scope.userPrefs.taskContext.length - 1]);
	};

	var resetContext = function() {
		for(var indexW in watchers) {
			var watcher = watchers[indexW];
			watcher(); // unwatch it
		}

		$scope.userPrefs.taskContext = [];
		$scope.userPrefs.contextText = '';		
		setTaskWithContext(null);
	};

	$scope.refresh = function() {
		tracker.sendEvent('app', 'refresh');
		if($scope.userPrefs.taskContext.length > 0) {
			AsanaService.fetchTaskDetails($scope.userPrefs.taskContext[$scope.userPrefs.taskContext.length - 1], true);	
		} else {
			AsanaService.refresh(false);
		}
	};

	$scope.changeWorkspace = function(workspace) {
		tracker.sendEvent('app', 'changeWorkspace');
		resetContext();
		AsanaService.selectWorkspace(workspace);
	};

	$scope.changeProject = function(project) {
		tracker.sendEvent('app', 'changeProject');
		resetContext();
		AsanaService.selectProject(project);
	};

	$scope.saveApiKey = function(apiKey) {
		if(typeof apiKey !== 'undefined' && apiKey !== '') {
			tracker.sendEvent('app', 'updateAPIKey');
			$scope.userPrefs.apiKey = apiKey;
			$scope.asana.init(apiKey, $scope);
			savePrefs();
		} else {
			notify({ message:'Please enter a valid API key.', classes: 'alert-custom' } );
		}
	};

	$scope.showDetails = function(taskId) {
		console.log("Showing details", taskId);
		for(var x = 0; x < $scope.tasks.length; x++) {
			var task = $scope.tasks[x];
			if(task.id == taskId) {
				$scope.asana.fetchTaskDetails(taskId, false);
				task.showDetails = true;
			}
			else task.showDetails = false;
		}
	};

	$scope.adjustFilter = function() {
		tracker.sendEvent('app', 'adjustFilter');
		if($scope.userPrefs.taskFilterCompleted === 'todo') {
			$scope.userPrefs.taskFilter['completed'] = false;
		} else if($scope.userPrefs.taskFilterCompleted === 'completed') {
			$scope.userPrefs.taskFilter['completed'] = true;
		} else if($scope.userPrefs.taskFilterCompleted === 'all') {
			delete $scope.userPrefs.taskFilter['completed'];
		}

		if($scope.userPrefs.taskFilterAssigned == 0 || $scope.userPrefs.taskFilterAssigned == null) {
			delete $scope.userPrefs.taskFilter['assignee'];
		} else {
			AsanaService.selectUser($scope.userPrefs.taskFilterAssigned);
			$scope.userPrefs.taskFilter['assignee'] = $scope.userPrefs.taskFilterAssigned;
		}

		console.log($scope.userPrefs.taskFilter, $scope.userPrefs.taskFilterAssigned, $scope.userPrefs.taskFilterCompleted);

		savePrefs();
	}

	tracker.sendAppView('MainView');
}]);