// var fs = null;
// var FOLDERNAME = 'testchromeapp';


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