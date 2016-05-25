// var fs = null;
// var FOLDERNAME = 'testchromeapp';
// &uid ==> user id
// Set Banner image according to the weekday
var header = document.getElementById('banner');
if(header) {
  var day = (new Date()).getDay();
  var baseUrl = 'http://recurship.com/build-a-mvp?utm_source=asanaviewer&utm_medium=app&utm_content=topbanner&utm_campaign=asana&utm_content=';
  if(day >= 1 && day < 4) { // Monday, Tuesday, Wednesday
    header.setAttribute('href', baseUrl + 'looking_to_build_an_mvp');
    header.innerHTML = "Looking to build a MVP? We are available.";
  } else if (day >= 4 && day < 6) { // Thursday, Fri
    header.setAttribute('href', baseUrl + 'have_an_idea');
    header.innerHTML = "Have an idea? I can help you build a MVP.";
  } else { // Sat, Sun
    header.setAttribute('href', baseUrl + 'support_for_side_project');
    header.innerHTML = "Need support for your side project? We can help.";
  }
}

/* Analytics library in bower was manually updated to 1.6.0 since bower couldnt find it */
var service = analytics.getService('asana-chrome-app');
window.tracker = service.getTracker('UA-18735851-11');
var resolutionLabel = window.innerWidth + ' x ' + window.innerHeight;
var trackResolution = analytics.EventBuilder.builder()
.category('app')
.action('resolution')
.dimension(1, resolutionLabel);
tracker.send(trackResolution.label(resolutionLabel));

function onError(e) {
  console.error('Error!', e);
}


function storeErrorCheck() {
	if(typeof chrome.runtime.lastError !== 'undefined') {
		console.error('Oops something went wrong while saving or getting locally.', chrome.runtime.lastError);
	}
}

function storeValue(key, value, callback) {
	var toStore = {};
	toStore[key] = value;
	chrome.storage.local.set(toStore, function() {
		storeErrorCheck();
		if(typeof callback !== 'undefined')
			callback();
	});
}

function getValue(key, callback) {
	chrome.storage.local.get(key, function(store) {
		storeErrorCheck();
		callback(store);
	});
}

// function writeFile(blob) {
//   if (!fs) {
//     return;
//   }

//   fs.root.getDirectory(FOLDERNAME, {create: true}, function(dirEntry) {
//     dirEntry.getFile(blob.name, {create: true, exclusive: false}, function(fileEntry) {
//       // Create a FileWriter object for our FileEntry, and write out blob.
//       fileEntry.createWriter(function(fileWriter) {
//         fileWriter.onerror = onError;
//         fileWriter.onwriteend = function(e) {
//           console.log('Write completed.');
//         };
//         fileWriter.write(blob);
//       }, onError);
//     }, onError);
//   }, onError);
// }

// document.addEventListener('DOMContentLoaded', function(e) {
//   console.log("Filesystem online.");

//   // FILESYSTEM SUPPORT --------------------------------------------------------
//   window.webkitRequestFileSystem(TEMPORARY, 1024 * 1024, function(localFs) {
//     fs = localFs;
//   }, onError);
//   // ---------------------------------------------------------------------------
// });
