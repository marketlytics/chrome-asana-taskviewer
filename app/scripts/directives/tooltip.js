angular.module('asanaChromeApp').
directive('tooltip', function() {
	return {
		restrict: 'A',
		scope: {
        	tooltip: '@'
      	},
      	link: function(scope, element, attrs) {
      		$(element).attr('title', attrs.tooltip);
      		$(element).tooltip({
      			container: 'body'
      		});
      	}
	};
});