'use strict';

var width = 500;
var height = 300;
var isHidden = false;

function createAppWindow() {
    chrome.app.window.create('index.html', {
        id: 'main',
        'alwaysOnTop': true,
        'focused': false,
        frame: 'none',
        bounds: {
            width: width,
            height: height,
            left: Math.round((screen.availWidth - width) / 2),
            top: Math.round((screen.availHeight - height)/2)
        }
    });
}

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
});

// Listens for the app launching then creates the window
chrome.app.runtime.onLaunched.addListener(function() {

  chrome.storage.onChanged.addListener(function(changes, areaName) {
    if(areaName === 'sync') {
        if(typeof changes.apiKey !== 'undefined') { // apiKey has changed
            var mainWindow = chrome.app.window.get('main');
            if(mainWindow !== null) {
                mainWindow.close(); // restart the app
            }

            createAppWindow();
        }
    }
  });

  chrome.storage.sync.get('apiKey', function(value) {
    console.log("Got this", value);
    if(typeof value.apiKey !== 'undefined' && value.apiKey !== '') {
        createAppWindow();
    } else {
        chrome.app.window.create('auth.html', {
            id: 'auth',
            'focused': true,
            bounds: {
              width: width,
              height: 130,
              left: Math.round((screen.availWidth - width) / 2),
              top: Math.round((screen.availHeight - 130)/2)
            }
        });

    }
  });

});
