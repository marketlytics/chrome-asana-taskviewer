/*
	Converts the attachment to link
*/
angular.module('asanaChromeApp').
filter('attachment', function() {
  return function(storyText) {
  	
  	if(storyText.indexOf('attached') !== -1) {
  		var url = storyText.match(/http.*/gm);
  		if(url.length > 0)
  			storyText = storyText.replace(url, '<a href="' + url[0] + '" target="_blank">this file</a>');
  	}
    return storyText;
  };
});
