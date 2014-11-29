angular.module('asanaChromeApp').
directive('item', function() {
	return {
		restrict: 'A',
		templateUrl: 'views/item.html',
		scope: {
        	item: '=',
        	project: '='
      	},
      	controller: 'ItemController'
	};
});