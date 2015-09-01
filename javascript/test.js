/*jslint node: true */

global.Future = require("./Future");
global.Log = require("./utils/Log");
global.checkResult = require("./utils/checkResult");

var fs = require("fs");
var path = require("path");

var httpClient = require("./utils/httpClient");

var totalSize = 0;
var url = "http://garfonso.darktech.org/luneos-testfile"; //palm-sdk_2.1.0-svn395514-pho516_i386.deb";
var filename = path.basename(url);

var lastPrinted = 0;
var stream = fs.createWriteStream(filename);
var options = {binary: true, method: "GET", headers: {},
				sizeCallback: function (size) {
					console.log("Got size: " + size);
					totalSize = size;
					lastPrinted = 0;
				},
				receivedCallback: function (rl) {
					//console.log("Received size: ", rl);
					var percent = (100 * rl / totalSize).toFixed(2);
					if (percent - lastPrinted > 1) {
						console.log(percent, " percent done.");
						lastPrinted = percent;
					}
				},
				redirectCallback: function (url) {
					var newFilename = path.basename(url);
					console.log("Got new url: ", url, " new filename would be ", newFilename);
					//stream = fs.createWriteStream(newFilename);
					//return stream;

					//TODO: check if this is possible on device. Otherwise we need to get rid of old file. We could, of course, also wait till download is done and rename file then...
					fs.rename(filename, newFilename, function (err) {
						if (err) {
							console.log("Could not rename file, because: ", err);
						} else {
							console.log("Renamed file from ", filename, " to ", newFilename);
							filename = newFilename;
						}
					});
				},
				filestream: stream};

httpClient.parseURLIntoOptions(url, options);

httpClient.sendRequest(options);
