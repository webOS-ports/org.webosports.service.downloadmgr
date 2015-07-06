/*jslint node: true */

global.Future = require("./Future");
global.Log = require("./utils/Log");
global.checkResult = require("./utils/checkResult");

var fs = require("fs");
var path = require("path");

var httpClient = require("./utils/httpClient");

var totalSize = 0;
var url = "http://garfonso.darktech.org/palm-sdk_2.1.0-svn395514-pho516_i386.deb";
var filename = path.basename(url);

var stream = fs.createWriteStream(filename);
var options = {binary: true, method: "GET", headers: {},
			   sizeCallback: function (size) {
			   		console.log("Got size: " + size);
					totalSize = size;
			   },
			   receivedCallback: function (rl) {
				   console.log("Received size: ", rl);
				   console.log((100 * rl / totalSize).toFixed(2), " percent done.");
			   },
			   redirectCallback: function (url) {
				   console.log("Got new url: ", url);
			   },
			  filestream: stream};

httpClient.parseURLIntoOptions(url, options);

httpClient.sendRequest(options);