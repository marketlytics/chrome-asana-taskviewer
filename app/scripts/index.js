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
controller('ItemController', ['$scope', function($scope) {
	$scope.showDetails = false;
	$scope.toggle = function() {
		if($scope.showDetails) $scope.showDetails = false;
		else $scope.showDetails = true;
	};
}]).
controller('TestController', ['$scope','Restangular', '$http', function($scope, Restangular, $http) {
	//var apiKey = "1nQW7qp.9dWZi5vfW3C3hZlVk0a1MCGW:"; << need to encode base64
	$scope.apiKey = "MW5RVzdxcC45ZFdaaTV2ZlczQzNoWmxWazBhMU1DR1c6";

	$scope.minimal = false;

	// getValue('apiKey', function(response) {
	// 	console.log(response.apiKey);

	// });

	Restangular.setDefaultHeaders({'Authorization': 'Basic ' + $scope.apiKey });
	Restangular.setBaseUrl('https://app.asana.com/api/1.0/');

	// Tasks for Alfred
	$scope.tasks = [];
	$scope.projects = [];
	$scope.workspaces = [];
	$scope.user = {};

	
	Restangular.one('users/me').get().then(function(response){
		//console.log("Me", response.data);
		// for(var imageKey in response.data.photo) {
		// 	var photoLink = response.data.photo[imageKey];
		// 	$http.get(photoLink, {responseType: 'blob'}).success(function(blob) {
		//     	blob.name = imageKey;
		//      	writeFile(blob);
		//      	response.data.photo[imageKey] = window.URL.createObjectURL(blob);
		//     });
		// }
		$scope.user = response.data;
		$scope.workspaces = response.data.workspaces;
	});


	Restangular.one('workspaces/78645207311/projects').get().then(function(response) {
		//console.log("Projects", JSON.stringify(response.data));
		//Projects [{"id":78647819937,"name":"Build Marketlytics website"},{"id":78647819954,"name":"online store to sell custom analytics scripts + services"},{"id":752920883901,"name":"tag1"},{"id":752920883904,"name":"tag2"},{"id":752920883907,"name":"tag3"},{"id":2714521945106,"name":"GA+CM Custom Dashboard"},{"id":2852843505909,"name":"James (Wordsru) GA Backend implementation"},{"id":7941251682209,"name":"Obaid Tasks"},{"id":15571422131519,"name":"Analytics Tasks"},{"id":111732829289,"name":"ML overview"},{"id":2972783632330,"name":"OGF Reporting"},{"id":4017413656450,"name":"fastspring data import KM"},{"id":4743637076618,"name":"SeamBliss"},{"id":4756052555961,"name":"Meeting Tasks"},{"id":7631925782755,"name":"Hussain Tasks"},{"id":7761381298865,"name":"Recuritment"},{"id":7940946686036,"name":"Mashhood Tasks"},{"id":8827900312555,"name":"UCC-v2"},{"id":18823615915441,"name":"Mooez Tasks"},{"id":19516083824667,"name":"Shamroze"},{"id":19516083824669,"name":"Haris"},{"id":19516083824731,"name":"Kashif"},{"id":19718851325201,"name":"Alfred"}] index.js:21
		$scope.projects = response.data;
	});


	Restangular.one('projects/19718851325201/tasks').get().then(function(response) {
		var tasks = [];
		for(var taskIndex in response.data) {
			var task = response.data[taskIndex];
			Restangular.one('tasks', task.id).get().then(function(response) {
				var fullTask = response.data;
				Restangular.one('tasks', task.id).one('stories').get().then(function(sResponse) {
					fullTask.stories = sResponse.data;
					console.log(fullTask);
					tasks.push(fullTask);
				});
			});
		}


		$scope.tasks = tasks;
	});

	$scope.toggleMinimal = function() {
		if($scope.minimal) {
			chrome.app.window.current().setBounds({ height: 450, width: 400 });
			$scope.minimal = false;
		} else {
			chrome.app.window.current().setBounds({ height: 69, width: 450 });
			$scope.minimal = true;
		}
	};

	$scope.details = function(itemId) {
		var el = $('#item' + itemId);
		var arrow = el.find('.glyphicon').first();

		if(arrow.hasClass('glyphicon-chevron-right')) {
			arrow.removeClass('glyphicon-chevron-right');
			arrow.addClass('glyphicon-chevron-down');
			el.append('<div class="details">Details will come here..</div>');

		} else {
			arrow.addClass('glyphicon-chevron-right');
			arrow.removeClass('glyphicon-chevron-down');
			el.find('.details').remove();
		}
	}

}]);