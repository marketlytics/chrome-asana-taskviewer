angular.module('asanaChromeApp').
service('AsanaService', ['Restangular','$base64', function(Restangular, $base64) {


	var storeKey = 'asanaStore';
	this.me = {};
	this.team = [];
	this.workspaces = [];
	this.projects = [];
	this.tasks = []; // stories reside inside their respective tasks
	this.loading = 0;

	
	var _this = this;

	// default error handling
	Restangular.setErrorInterceptor(function(response, deferred, responseHandler) {
    	/*
			TODO show the user the error so they can react accordingly.
    	*/
    	_this.loading -= 1;
	    console.error('Request failed with status: ', response.status, response);
	    Bugsnag.notify("AsanaError", "Request failed: " + JSON.stringify(response));
	    return true; // error not handled
	});

	this.selectUser = function(userId) {
		for(var x = 0; x < _this.team; x++) {
			_this.team[x].isSelected = _this.team[x].id == userId;
		}
		_this.sync();
	};

	this.selectWorkspace = function(workspaceId) {
		_this.loading += 2;
		for(var x = 0; x < _this.workspaces.length; x++) {
			_this.workspaces[x]['isSelected'] = (workspaceId == _this.workspaces[x].id);
		}

		Restangular.one('workspaces/' + workspaceId + '/projects').get().then(function(response) {
			_this.loading -= 1;
			_this.projects = response.data;
			_this.selectProject(response.data[0].id);
		});

		Restangular.one('workspaces', workspaceId).one('users').get().then(function(response) {
			_this.loading -= 1;
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
		_this.loading += 1;
		for(var x = 0; x < _this.projects.length; x++) {
			_this.projects[x]['isSelected'] = (projectId == _this.projects[x].id);
		}

		Restangular.one('projects/' + projectId + '/tasks?opt_fields=assignee,completed,due_on,name,notes').get().then(function(response) {
			_this.loading -= 1;
			_this.tasks = response.data;
			_this.sync(); // done at the end (when tasks are fetched and on each item)
		});
	};

	var deepFind = function(tasks, taskId) {
		if(typeof tasks !== 'undefined' && tasks.length > 0 && taskId !== null) {
			for(var x = 0; x < tasks.length; x++) {
				var task = tasks[x];
				var subtask = deepFind(task.subtasks, taskId);
				if(subtask !== null) {
					return subtask;
				}

				if(task.id === taskId) {
					return task;
				}
			}
		}
		return null;
	};

	this.findTask = function(taskId) {
		return deepFind(_this.tasks, taskId);
	};

	this.fetchTaskDetails = function(taskId, force) {
		var task = _this.findTask(taskId);
		if(task === null) {
			Bugsnag.notify("AsanaError", "Unable to find task ID.");
			console.error('Unable to find task with ID', taskId);
			return;
		}

		if(typeof task.stories !== 'undefined' && !force) return; // already fetched before.
		_this.loading += 2;
		Restangular.one('tasks', task.id).one('stories').get().then(function(response) {
			_this.loading -= 1;
			task.stories = response.data;
			_this.sync();
		});

		Restangular.one('tasks', task.id).one('subtasks?opt_fields=assignee,completed,due_on,name,notes').get().then(function(response) {
			_this.loading -= 1;
			task.subtasks = response.data;
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

	this.autoRefresh = function(since, callback) {
		var activeProject = _this.getActiveProject();
		Restangular.one('tasks?opt_fields=assignee,completed,due_on,name,notes&project=' + activeProject.id + '&modified_since=' + since).get().then(function(response) {
			for(var x = 0; x < response.data.length; x++) {
				var updatedTask = response.data[x];
				var actualTask = _this.findTask(updatedTask.id);

				if(actualTask === null) { // Task not found, just add it in
					if(!actualTask.parent) {
						_this.tasks.push(updatedTask);
					}
				} else {
					actualTask.name = updatedTask.name;
					actualTask.due_on = updatedTask.due_on;
					actualTask.notes = updatedTask.notes;
					actualTask.completed = updatedTask.completed;
					actualTask.assignee = updatedTask.assignee;
				}
			}
			_this.sync();
			if(callback)
				callback(response.data);
		});
	}
	
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
		_this.loading += 1;
		Restangular.one('users/me').get().then(function(response){
			_this.loading -= 1;
			_this.me = response.data;
			_this.workspaces = response.data.workspaces;
			delete _this.me.workspaces; // to avoid collisions
			_this.selectWorkspace(_this.workspaces[0].id); // fetch projects for the first workspace
		});
	};

	this.init = function(apiKey, scope) { // scope sent in to update the view
		
		Restangular.setDefaultHeaders({'Authorization': 'Basic ' + $base64.encode(apiKey + ':') });
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

	this.toggleTaskComplete = function(taskId, completed) {
		_this.loading += 1;
		Restangular.one('tasks', taskId).put({ completed: completed}).then(function(response) {
			_this.loading -= 1;
		});
	};

	this.addStoryToTask = function(taskId, story) {
		for(var x = 0; x < _this.tasks.length; x++) {
			var task = _this.tasks[x];
			if(task.id == taskId) {
				if(typeof task.stories !== 'undefined') {
					task.stories.push(story);
				} else {
					task.stories = [story];
				}
			}
		}
	};

	this.commentOnTask = function(taskId, comment) {
		_this.loading += 1;
		Restangular.one('tasks', taskId).customPOST({}, 'stories', { text: comment }).then(function(response) {
			_this.loading -= 1;
			_this.addStoryToTask(taskId, response.data);
		});
	};

}]);