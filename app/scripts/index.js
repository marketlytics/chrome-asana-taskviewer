'use strict';


// Declare app level module which depends on views, and components
angular.module('asanaChromeApp', ['restangular', 'base64', 'angular-bugsnag'])
	.config(['bugsnagProvider', function (bugsnagProvider) {
        bugsnagProvider
            .apiKey('0c8959e2156f1fbb387e804711470e47')
            .releaseStage('development')
            .appVersion('0.1.0')
            .beforeNotify(['$log', function ($log) {
                return function (error, metaData) {
                    $log.debug(error.name);
                    return true;
                };
            }]);
    }]);
