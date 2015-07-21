'use strict';

var isHidden = false;

var createAppWindow = function(userPrefs) {

    var mainWindow = chrome.app.window.get('main');

    if(mainWindow !== null) {
      mainWindow.close();
    }

    var alwaysOnTop = true;
    if(userPrefs !== null)
        alwaysOnTop = userPrefs.alwaysOnTop;
    setTimeout(function() {
      chrome.app.window.create('index.html', {
          id: 'main',
          'alwaysOnTop': alwaysOnTop,
          'focused': false,
          singleton: true,
          outerBounds: {
              width: 420,
              height: 600,
              left: Math.round((screen.availWidth - 420) / 2),
              top: Math.round((screen.availHeight - 460)/2),
              minWidth: 420,
              minHeight: 110
          }
      });
    }, 1000);
};

chrome.commands.onCommand.addListener(function(command) {

    if(command === 'toggle_window') {
        if(isHidden) {
            chrome.app.window.get('main').show();
            isHidden = false;
        } else {
            chrome.app.window.get('main').hide();
            isHidden = true;
        }
    }

    if(command === 'add_task') {
        if(isHidden) {
            chrome.app.window.get('main').show();
            isHidden = false;
        }
    }
});

// Listens for the app launching then creates the window
chrome.app.runtime.onLaunched.addListener(function() {

    chrome.storage.onChanged.addListener(function(changes, areaName) {
        console.log(changes, areaName);
        if(areaName === 'local') {
            if(typeof changes.apiKey !== 'undefined') { // apiKey has changed

                chrome.storage.local.get('userPrefs', function(result) { // set the result in the view object (for angular)
                    if(typeof result.userPrefs === 'undefined') {
                        result.userPrefs = {};
                    }

                    result.userPrefs.apiKey = changes.apiKey.newValue;
                    console.log('Updated apiKey');
                    chrome.storage.local.set(result, function() { // save it again
                        createAppWindow(result.userPrefs); // restart it so services are created again.
                    });
                });
            }
        }
    });

    chrome.storage.local.get('userPrefs', function(value) {
        if(typeof value.userPrefs !== 'undefined' &&
            typeof value.userPrefs.apiKey !== 'undefined' &&
            value.userPrefs.apiKey !== '') {
              createAppWindow(value.userPrefs);
        } else {
            chrome.app.window.create('auth.html', {
                id: 'auth',
                'focused': true,
                bounds: {
                  width: 500,
                  height: 140,
                  left: Math.round((screen.availWidth - 500) / 2),
                  top: Math.round((screen.availHeight - 140) / 2)
                }
            });

        }
    });

});
