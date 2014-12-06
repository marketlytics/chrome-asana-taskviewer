/*
	Converts the attachment to link
*/
angular.module('asanaChromeApp').
filter('attachment', function() {
  return function(storyText) {  	
		var url = storyText.match(/([-a-zA-Z0-9^\p{L}\p{C}\u00a1-\uffff@:%_\+.~#?&//=]{2,256}){1}(\.[a-z]{2,4}){1}(\:[0-9]*)?(\/[-a-zA-Z0-9\u00a1-\uffff\(\)@:%,_\+.~#?&//=]*)?([-a-zA-Z0-9\(\)@:%,_\+.~#?&//=]*)?/gm);
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
