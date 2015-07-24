angular.module('asanaChromeApp').
service('AsanaService', ['Restangular','$base64', 'notify', function(Restangular, $base64, notify) {
	'use strict';

	var storeKey = 'asanaStore';
	var optFields = 'opt_fields=assignee.name,assignee,projects,assignee_status,completed,due_on,name,notes,hearted,num_hearts,followers,modified_at,followers.name';
	this.me = {};
	this.team = [];
	this.workspaces = [];
	this.projects = [];
	this.tasks = []; // stories reside inside their respective tasks
	this.loading = 0;

	var isDeviceOnline = function() {
		if(typeof navigator === 'undefined' || typeof navigator.onLine === 'undefined') {
			return true; // if we cant detect offline we assume its always online
		}
		return navigator.onLine;
	};

	var _this = this;

	// default error handling
	Restangular.setErrorInterceptor(function(response) {
		if(_this.loading < 0) // incase of repeated failures
			_this.loading = 0;
		else
    		_this.loading -= 1;

	    console.error('Request failed with status: ', response);

			if(!isDeviceOnline()) {
				// TODO in future detect the type of request using URL and change the message accordingly
				// there should also be rollback of the action taken to avoid confusion
				tracker.sendEvent('app', 'error', 'Unable to perform action since device offline.');
				notify({ message:'This action is currently not available in offline mode.', classes: 'alert-custom' } );
				return true;
			}

	    if(typeof response.data !== 'undefined' && typeof response.data.errors !== 'undefined') {
	    	tracker.sendEvent('app', 'error', response.data.errors[0].message);
	    	notify({ message:'Error from Asana: ' + response.data.errors[0].message, classes: 'alert-custom' } );
	    } else {
	    	tracker.sendEvent('app', 'error', response.statusText);
	    	notify({ message:'Unexpected error: ' + response.statusText, classes: 'alert-custom' } );
	    }

	    return true; // error not handled
	});

	/* Getting data */
	this.selectUser = function(userId) {
		for(var x = 0; x < _this.team.length; x++) {
			_this.team[x].isSelected = (parseInt(_this.team[x].id) === parseInt(userId));
		}
		_this.sync();
	};

	this.addTask = function(projectId, name, notes, assignee, dueDate) {
		_this.loading += 1;
		var currentWorkspace = this.getActiveWorkspace();
		var data = {
			assignee: assignee,
			name: name,
			due_at: dueDate,
			notes: notes,
			workspace: currentWorkspace.id,
			projects: projectId
		};

		if(!projectId) delete data.projects;
		if(projectId[0] === 0) {
			data.assignee = _this.me.id;
			delete data.projects;
		}

		return Restangular.one('tasks').post('',{
			data: data
		}).then(function() {
			_this.loading -= 1;
			// add to the project as well
		});
	};

	this.selectWorkspace = function(workspaceId) {
		_this.loading += 2;
		for(var x = 0; x < _this.workspaces.length; x++) {
			_this.workspaces[x].isSelected = (parseInt(workspaceId) === _this.workspaces[x].id);
		}

		Restangular.one('workspaces/' + workspaceId + '/projects?opt_fields=archived,name,color,workspace,team,team.name').get().then(function(response) {
			_this.loading -= 1;
			var activeProjects = [];
			for(var x = 0; x < response.data.length; x++) {
				var project = response.data[x];
				if(!project.archived) { // filter out archived projects
					activeProjects.push(project);
				}
			}
			_this.projects = activeProjects;
			_this.projects.unshift({
				id: 0,
				name: 'All (assigned to me)',
			});

			_this.selectProject(0);
		});

		Restangular.one('workspaces', workspaceId).one('users').get().then(function(response) {
			_this.loading -= 1;
			var users = [];
			users.push({
				id: '0',
				name: 'None',
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
		var path = 'projects/' + projectId + '/tasks?' + optFields;
		for(var x = 0; x < _this.projects.length; x++) {
			_this.projects[x].isSelected = (parseInt(projectId) === _this.projects[x].id);
		}

		_this.loading += 1;

		if(parseInt(projectId) === 0) { // differnt route for fetching all tasks
			path = 'tasks?assignee=me&workspace=' + _this.getActiveWorkspace().id + '&' + optFields;
		}

		Restangular.one(path).get().then(function(response) {
			_this.loading -= 1;
			// loop below is to add blank string
			for(var m = 0; m < response.data.length; m++) {
				if(response.data[m].assignee === null) {
					response.data[m].assignee = {
						id: '',
						name: ''
					};
				}
			}
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
			tracker.sendEvent('app', 'error', 'Unable to find task ID.');
			console.error('Unable to find task with ID', taskId);
			notify({ message:'Oops, cant to find task ID, try refreshing?' , classes: 'alert-custom' } );
			return;
		}

		if(typeof task.stories !== 'undefined' && !force) { return; }// already fetched before.
		_this.loading += 2;
		Restangular.one('tasks', task.id).one('stories').get().then(function(response) {
			_this.loading -= 1;
			task.stories = response.data;
			_this.sync();
		});

		Restangular.one('tasks', task.id).one('subtasks?' + optFields).get().then(function(response) {
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

	this.getActiveWorkspace = function() {
		for(var x = 0; x < _this.workspaces.length; x++) {
			var workspace = _this.workspaces[x];
			if(workspace.isSelected) {
				return workspace;
			}
		}
		return _this.workspaces[0];
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
		var path = '&project=' + activeProject.id;

		if(activeProject.id === 0) { // all selected
			var activeWorkSpace = _this.getActiveWorkspace();
			path = '&assignee=me&workspace=' + activeWorkSpace.id;
		}

		Restangular.one('tasks?' + optFields +'&modified_since=' + since + path).get().then(function(response) {
			for(var x = 0; x < response.data.length; x++) {
				var updatedTask = response.data[x];
				var actualTask = _this.findTask(updatedTask.id);

				if(actualTask === null) { // Task not found, just add it in
					if(!updatedTask.parent) {
						_this.tasks.push(updatedTask);
					}
				} else {
					for(var key in actualTask) {
						actualTask[key] = updatedTask[key]; // update all the values
					}
					actualTask.showDetails = false;
					delete actualTask.stories;
				}
			}
			_this.sync();
			if(callback) {
				callback(response.data);
			}
		});
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
				console.log('Fetched data locally:', asana);
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

	/* Modifying */

	this.toggleTaskComplete = function(taskId, completed) {
		_this.loading += 1;
		tracker.sendEvent('task', 'completed', completed);
		Restangular.one('tasks', taskId).customPUT({ data: { completed: completed }}).then(function() {
			_this.loading -= 1;
		});
	};

	this.addStoryToTask = function(taskId, story) {
		for(var x = 0; x < _this.tasks.length; x++) {
			var task = _this.tasks[x];
			if(task.id === taskId) {
				if(typeof task.stories !== 'undefined') {
					task.stories.push(story);
				} else {
					task.stories = [story];
				}
			}
		}
	};

	this.addAttachmentToTask = function(taskId, file) {
		_this.loading += 1;
		Restangular.one('tasks', taskId).withHttpConfig({transformRequest: angular.identity}).customPOST(file, 'attachments', undefined, {'Content-Type': undefined}).then(function() {
			_this.loading -= 1;
			_this.fetchTaskDetails(taskId, true);
		});
	};

	this.commentOnTask = function(taskId, comment) {
		_this.loading += 1;
		tracker.sendEvent('task', 'comment');
		Restangular.one('tasks', taskId).customPOST({}, 'stories', { text: comment }).then(function(response) {
			_this.loading -= 1;
			_this.addStoryToTask(taskId, response.data);
		});
	};

}]);
