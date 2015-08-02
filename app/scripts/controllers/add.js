angular.module('asanaChromeApp').
controller('AddController', ['$scope', 'AsanaService', 'notify', function($scope, AsanaService, notify) {
	'use strict';

    // the object sent to the server to add.
    $scope.adding = {
		project: 0,
		title: '',
		description: '',
		dueDate: '',
		assigned: '0',
        dueTime: 'none'
    };

	$scope.currentProject = null;

    $scope.asana = AsanaService;

	$scope.addTask = function() {
		var objectToAdd = angular.copy($scope.adding);

		if(!objectToAdd.title || objectToAdd.title.trim().length <= 0) {
			notify({ message:'Title cannot be empty.' , classes: 'alert-custom' } );
			return;
		}

		if(!objectToAdd.project) {
			objectToAdd.project = [ $scope.asana.getActiveProject().id ];
		} else {
			objectToAdd.project = [ objectToAdd.project ];
		}

		var dueDate = null;
		if(objectToAdd.dueDate) {
			dueDate = objectToAdd.dueDate;
			if(objectToAdd.dueTime !== 'none') {
				dueDate.setHours(objectToAdd.dueTime, 0, 0, 0);
			}
			dueDate = dueDate.toISOString();
		}

		var assignee = objectToAdd.assigned;
		if(assignee === '0') {
			assignee = null;
		}

		$scope.asana.addTask(objectToAdd.project, objectToAdd.title, objectToAdd.description, assignee, dueDate).then(function() {
			notify({ message:'Your task has been added.' , classes: 'alert-success' } );
		});

		$scope.adding.title = '';
		$scope.adding.description = '';
		$scope.adding.dueTime = 'none';
		$scope.adding.dueDate = '';
		$scope.adding.dueDate = '';
		$scope.adding.assigned = '0';
	};
}]);
