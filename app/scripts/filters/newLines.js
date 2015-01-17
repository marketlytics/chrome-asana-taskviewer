angular.module('asanaChromeApp').
filter('newLines', function() {
  return function(string) {
    return string.replace(/(?:\r\n|\r|\n)/g, '<br />');
  };
});
