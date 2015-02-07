/*
	Converts the attachment to link
*/
angular.module('asanaChromeApp').
filter('attachment', function() {
  return function(storyText) {
		var url = storyText.match(/(https?|ftp):\/\/[^\s/$.?#]+.[^\s]*/gm);
		if(url && url.length > 0) {
      if(storyText.indexOf('attached') !== -1) {
			 storyText = storyText.replace(url[0], '<a href="' + url[0] + '" target="_blank">this file</a>');
      } else {
        for(var x = 0; x < url.length; x++) {
          storyText = storyText.replace(url[x], '<a href="' + url[x] + '" target="_blank">' + url[x] + '</a>');
        }
      }
    }
    return storyText;
  };
});
