'use strict';


// Declare app level module which depends on views, and components
angular.module('chromeTest', ['ngRoute', 'restangular']).
directive('item', function() {
	return {
		restrict: 'A',
		templateUrl: 'views/item.html',
		scope: {
        	item: '='
      	},
      	controller: 'ItemController'
	};
}).
controller('ItemController', ['$scope', 'AsanaService', function($scope, AsanaService) {
	$scope.showDetails = false;
	$scope.toggle = function(taskId) {
		console.log('fetching', taskId);
		AsanaService.fetchTaskDetails(taskId);
		if($scope.showDetails) $scope.showDetails = false;
		else $scope.showDetails = true;
	};
}]).
service('AsanaService', ['Restangular', function(Restangular) {


	var storeKey = 'asanaStore';
	this.me = {};
	this.team = [];
	this.workspaces = [];
	this.projects = [];
	this.tasks = [];
	// stories reside inside their respective tasks

	var _this = this;

	// default error handling
	Restangular.setErrorInterceptor(function(response, deferred, responseHandler) {
    	/*
			TODO show the user the error so they can react accordingly.
    	*/
	    console.error('Request failed with status: ', response.status, response);
	    return true; // error not handled
	});

	this.selectUser = function(userId) {
		for(var x = 0; x < _this.team; x++) {
			_this.team[x].isSelected = _this.team[x].id == userId;
		}
		_this.sync();
	};

	this.selectWorkspace = function(workspaceId) {
		console.log("workspaceId", workspaceId);
		for(var x = 0; x < _this.workspaces.length; x++) {
			_this.workspaces[x]['isSelected'] = (workspaceId == _this.workspaces[x].id);
		}

		Restangular.one('workspaces/' + workspaceId + '/projects').get().then(function(response) {
			_this.projects = response.data;
			_this.selectProject(response.data[0].id);
		});

		Restangular.one('workspaces', workspaceId).one('users').get().then(function(response) {
			var users = [];
			users.push({
				id: '0',
				name: 'Show all',
				isSelected: true
			});

			for(var x = 0; x < response.data.length; x++) {
				response.data[x].isSelected = false; 
				users.push(response.data[x]);
			}
			_this.team = users;
			_this.sync();
		});
	};

	this.selectProject = function(projectId) {
		console.log('selectedProject', projectId);
		for(var x = 0; x < _this.projects.length; x++) {
			_this.projects[x]['isSelected'] = (projectId == _this.projects[x].id);
		}

		Restangular.one('projects/' + projectId + '/tasks?opt_fields=assignee,completed,due_on,name').get().then(function(response) {
			_this.tasks = response.data;
			_this.sync(); // done at the end (when tasks are fetched and on each item)
		});
	};

	this.findTask = function(taskId) {
		for(var x = 0; x < _this.tasks.length; x++) {
			var task = _this.tasks[x];
			if(task.id === taskId) {
				return task;
			}
		}

		return null;
	};

	this.fetchTaskDetails = function(taskId) {

		var task = _this.findTask(taskId);
		if(task === null) {
			console.error('Unable to find task with ID', taskId);
			return;
		}

		if(typeof task.stories !== 'undefined') return; // already fetched before.

		Restangular.one('tasks', task.id).one('stories').get().then(function(response) {
			task.stories = response.data;
			_this.sync();
		});
	};

	this.getActiveProject = function() {
		for(var x = 0; x < _this.projects.length; x++) {
			var project = _this.projects[x];
			if(project.isSelected) {
				return project;
			}
		}		
		return _this.projects[0];
	};

	this.refresh = function(refreshEverything) {
		if(refreshEverything) {
			_this.getMeData();
		} else {
			var activeProject = _this.getActiveProject();
			_this.selectProject(activeProject.id);
		}
	};
	
	this.sync = function() {
		var data = {
			me: _this.me,
			team: _this.team,
			workspaces: _this.workspaces,
			projects: _this.projects,
			tasks: _this.tasks
		};

		storeValue(storeKey, data, function() {
			console.log('Sync complete.');
		});

	};

	this.getMeData = function() {
		Restangular.one('users/me').get().then(function(response){
			_this.me = response.data;
			_this.workspaces = response.data.workspaces;
			delete _this.me.workspaces; // to avoid collisions
			_this.selectWorkspace(_this.workspaces[0].id); // fetch projects for the first workspace
		});
	};

	this.init = function(apiKey, scope) { // scope sent in to update the view
		// TODO apiKey to base64
		apiKey = 'MW5RVzdxcC45ZFdaaTV2ZlczQzNoWmxWazBhMU1DR1c6'; // need to convert orginal to Base64!

		Restangular.setDefaultHeaders({'Authorization': 'Basic ' + apiKey });
		Restangular.setBaseUrl('https://app.asana.com/api/1.0/');

		getValue(storeKey, function(store) {
			if(typeof store[storeKey] === 'undefined') {
				_this.getMeData();
			} else {
				var asana = store[storeKey];
				console.log("Fetched data locally:", asana);
				scope.$apply(function() {
					_this.me = asana.me;
					_this.team = asana.team;
					_this.workspaces = asana.workspaces;
					_this.projects = asana.projects;
					_this.tasks = asana.tasks;
				});
			}
		});
	};

	
}]).
controller('TestController', ['$scope','AsanaService', '$http', function($scope, AsanaService, $http) {
	$scope.asana = AsanaService;
	$scope.taskFilterCompleted = 'all';
	$scope.taskFilter = {};

	getValue('apiKey', function(value){
		if(typeof value.apiKey !== 'undefined') {
			$scope.asana.init(value.apiKey, $scope);
		}
	});

	getValue('taskFilter', function(value){
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

		if($scope.taskFilterAssigned === 0) {
			delete $scope.taskFilter['assignee'];
		} else {
			$scope.asana.selectUser($scope.taskFilterAssigned);
			$scope.taskFilter['assignee'] = $scope.taskFilterAssigned;
		}

		storeValue('taskFilter', $scope.taskFilter);
	}

}]);