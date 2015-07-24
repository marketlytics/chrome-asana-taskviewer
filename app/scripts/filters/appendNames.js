/*
	Converts the attachment to link
*/
angular.module('asanaChromeApp').
filter('appendNames', function() {
  'use strict';
  return function(prestring, items) {
    if(items.length <= 0)
      return 'Noone.. :(';

    for(var x = 0; x < items.length; x++) {
      var item = items[x];
      prestring += item.name + ', ';
    }
    return prestring.substring(0, prestring.length - 2);
  };
});
