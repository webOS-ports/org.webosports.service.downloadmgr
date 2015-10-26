/*jslint node: true */
/*global Future, fs, Log, httpClient */

var path = require("path");

var Downloader = function () {
	"use strict";
	//private variables:

	//private functions:
	function getFilename(options) {
		if (options.target) {
			return options.target;
		}

		var filename, c = 0;
		if (options.targetDir) {
			filename = options.targetDir;
		} else if (options.ticket && options.ticket.destPath) {
			filename = options.ticket.destPath;
		} else {
			filename = "/media/internal/downloads";
		}

		if (filename.charAt(filename.length - 1) !== "/") {
			filename += "/";
		}

		if (options.targetFilename) {
			filename += options.targetFilename;
		} else if (options.ticket && options.ticket.destFile) {
			filename += options.ticket.destFile;
		} else {
			while (fs.existsSync(filename + "download" + c)) {
				c += 1;
			}
			filename = filename + "download" + c;
		}
	}

	function sizeCallback(options, size) {
		Log.debug("Got size: ", size, " for ", options.url);
		if (options.ticket) {
			options.ticket.amountTotal = size;
		}
		options.lastPrinted = 0;
		options.totalSize = size;
		if (typeof options.sizeCallback === "function") {
			options.sizeCallback(size);
		}
	}

	function receivedCallback(options, rl) {
		//console.log("Received size: ", rl);
		var percent = (100 * rl / options.totalSize).toFixed(2);
		if (percent - options.lastPrinted > 1) {
			Log.debug(percent, " percent done for ", options.url);
			options.lastPrinted = percent;
		}
		if (options.ticket) {
			options.ticket.amountReceived = rl;
		}
		if (typeof options.receivedCallback === "function") {
			options.receivedCallback(rl);
		}
	}

	function redirectCallback(options, url) {
		var newFilename = path.basename(url);
		Log.debug("Got new url: ", url, " new filename would be ", newFilename);
		//stream = fs.createWriteStream(newFilename);
		//return stream;

		//TODO: check if this is possible on device. Otherwise we need to get rid of old file. We could, of course, also wait till download is done and rename file then...
		fs.rename(options.filename, newFilename, function (err) {
			if (err) {
				console.log("Could not rename file, because: ", err);
			} else {
				console.log("Renamed file from ", options.filename, " to ", newFilename);
				options.filename = newFilename;
			}
		});

		if (typeof options.redirectCallback === "function") {
			options.redirectCallback(url);
		}
	}

	//public interface:
	return {
		download: function (options) {
			var stream,
				filename,
				httpClientOptions = {},
				outerFuture = new Future();

			filename = getFilename(options);
			Log.debug("Got filename ", filename, " from ", options);
			options.filename = filename;
			stream = fs.createWriteStream(filename);

			httpClientOptions.binary = true; //set this to prevent httpClient to try anything fancy and just pipe input to file.
			httpClientOptions.method = "GET";
			httpClientOptions.headers = {};
			httpClientOptions.sizeCallback = sizeCallback.bind(this, options);
			httpClientOptions.receivedCallback = options.receivedCallback || receivedCallback.bind(this, options);
			httpClientOptions.redirectCallback = options.redirectCallback || redirectCallback.bind(this, options);
			httpClientOptions.filestream = stream;

			httpClient.parseURLIntoOptions(options.url, httpClientOptions);

			httpClient.sendRequest(httpClientOptions);

		}
	};
};

module.exports = Downloader;
