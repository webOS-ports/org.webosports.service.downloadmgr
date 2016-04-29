/*jslint node: true */
/*global Future, fs, Log, httpClient */

var path = require("path");

var Downloader = (function () {
	"use strict";
	//private variables:
	var ticketIdToReqNum = {};

	//private functions:
	function sizeCallback(options, size) {
		Log.debug("Got size: ", size, " for ", options.url);
		if (options.ticket) {
			options.ticket.amountTotal = parseInt(size, 10);
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
		options.url = url;
		if (options.ticket) {
			options.ticket.url = url;
		}
		Log.debug("Got new url: ", url);

		if (options.keepFilenameOnRedirect) {
			Log.debug("Client wants us to keep filename, so do nothing.");
			return;
		}

		var oldFilename, newFilename;
		oldFilename = options.currentFilename;
		newFilename = Downloader.getFilename(options); //refill target

		//TODO: check if this is possible on device. Otherwise we need to get rid of old file. We could, of course, also wait till download is done and rename file then...
		fs.rename(oldFilename, newFilename, function (err) {
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

	function reqNumCallback(options, reqNum) {
		options.reqNum = reqNum;
		if (options.ticket && options.ticket.ticketId >= 0) {
			ticketIdToReqNum[options.ticket.ticketId] = reqNum;
			Log.debug("Stored ", reqNum, " for ", options.ticket.ticketId);
		} else {
			Log.debug("Received request number ", reqNum, ", but has no ticket, so can't store it, only in options.");
		}
	}

	function fileError(options, error) {
		Log.log("Error ", error, " occured during download.");
		if (options.ticket) {
			options.ticket.completionStatusCode = -4; //filesystem error
			options.ticket.completed = false;
			options.ticket.interrupted = true;
			options.ticket.aborted = true;
			Downloader.cancel(options.ticket);
			Log.debug("Ticket modified. Download cancelled.");
		} else if (options.reqNum >= 0) {
			httpClient.cancelRequest(options.reqNum);
			Log.debug("No ticket, download cancelled.");
		} else {
			Log.debug("No request, yet. Can't cancel.");
		}
	}

	//public interface:
	return {
		//options parameter will be altered!
		//expected fields:
		// url: url to download from
		// target: destination path + file
		// targetDir: destination path
		// targetFilename: destination filename
		// ticket: ticket db structure (will be updated if present)
		// sizeCallback: function that will be called with determined size as only parameter
		// receivedCallback: function that will be called with num bytes received so far as only prameter
		// redirectCallback: function that will be called with new url on redirect as only parameter
		// cookieHeader: additional cookies for download.
		// mime: mime header to set for requests.
		// canHandlePause: not used, yet
		// keepFilenameOnRedirect: does what it says. Otherwise a new filename will be derived from a redirect.
		//returns future
		download: function (options) {
			var stream,
				filename,
				httpClientOptions = {},
				future = new Future();

			filename = Downloader.getFilename(options);
			Log.debug("Got filename ", filename, " from ", options);
			options.filename = filename;
			stream = fs.createWriteStream(filename);
			stream.on("error", fileError.bind(this, options));

			httpClientOptions.binary = true; //set this to prevent httpClient to try anything fancy and just pipe input to file.
			httpClientOptions.method = "GET";
			httpClientOptions.headers = {
				Cookie: options.cookieHeader,
				"Content-Type": options.mime
			};
			httpClientOptions.sizeCallback = sizeCallback.bind(this, options);
			httpClientOptions.receivedCallback = receivedCallback.bind(this, options);
			httpClientOptions.redirectCallback = redirectCallback.bind(this, options);
			httpClientOptions.reqNumCallback = reqNumCallback.bind(this, options);
			httpClientOptions.filestream = stream;

			httpClient.parseURLIntoOptions(options.url, httpClientOptions);

			future.nest(httpClient.sendRequest(httpClientOptions));

			future.then(function processDownloadResult() {
				var result = future.result, out;

				//translate httpClient result into ticket
				if (options.ticket) {
					options.ticket.httpStatus = result.returnCode;
					//only set those if not yet present.
					options.ticket.interrupted = !result.returnValue;
					options.ticket.completed = result.returnValue;
					if (result.returnValue) {
						options.ticket.completionStatusCode = 200;
					} else {
						if (result.returnCode < 0) {
							options.ticket.completionStatusCode = result.returnCode; //currently only -1 = general error. Do we really need this to be more specific?
						} else {
							options.ticket.completionStatusCode = -5; //means some http error -> see httpStatus code.
						}
					}
				}
				future.result = result; //transfer result outside.
			});

			return future;
		},

		//cancel download with ticketId
		cancel: function (ticketId) {
			var reqNum = ticketIdToReqNum[ticketId];
			Log.debug("Resolved ", ticketId, " to ", reqNum);
			if (reqNum >= 0) {
				httpClient.cancelRequest(reqNum);
			} else {
				Log.log("Could not cancel download ", ticketId, ", because request was not found.");
			}
		},

		//fills filename and path variables in options and returns complete file path
		getFilename: function (options) {
			if (!options.url && options.ticket && options.ticket.url) {
				options.url = options.ticket.url;
			}
			if (!options.url) {
				throw "Missing url.";
			}
			if (options.target) {
				return options.target;
			}

			var fpath, filename, filepath, c = 0;
			if (options.targetDir) {
				fpath = options.targetDir;
			} else if (options.ticket && options.ticket.destPath) {
				fpath = options.ticket.destPath;
			} else {
				fpath = "/media/internal/downloads";
			}

			if (fpath.charAt(fpath.length - 1) !== "/") {
				fpath += "/";
			}
			options.targetDir = fpath;
			if (options.ticket) {
				options.ticket.destPath = fpath;
			}

			if (options.targetFilename) {
				filename = options.targetFilename;
			} else if (options.ticket && options.ticket.destFile) {
				filename = options.ticket.destFile;
			} else if (options.url.indexOf("/") > 0 && options.url.charAt(options.url.length - 1) !== "/") { //if there is a filename in url, use this.
				filename = path.basename(options.url);
			} else {
				while (fs.existsSync(fpath + "download" + c)) {
					c += 1;
				}
				filename = "download" + c;
			}

			options.targetFilename = filename;
			if (options.ticket) {
				options.ticket.destFile = filename;
			}

			options.target = fpath + filename;
			if (options.ticket) {
				options.ticket.target = fpath + filename;
			}

			return options.target;
		}
	};
}());

module.exports = Downloader;
