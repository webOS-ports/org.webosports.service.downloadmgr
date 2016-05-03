/*jslint node: true */
/*global console, require */

var fs = require("fs");

var Log = (function () {
	"use strict";
	var filestream;

	function dummy() {
		return undefined;
	}

	function printObjImpl(obj, depth) {
		var key, msg = "{";
		if (depth < 5) {
			for (key in obj) {
				if (obj.hasOwnProperty(key)) {
					try {
						msg += " " + key + ": " + JSON.stringify(obj[key]) + ",";
					} catch (e) {
						msg += " " + key + ": " + printObjImpl(obj[key], depth + 1) + ",";
					}
				}
			}
			msg[msg.length - 1] = "}";
		} else {
			msg = "...";
		}
		return msg;
	}

	function logBase() {
		var i, pos, datum, argsArr = Array.prototype.slice.call(arguments, 0),
			data;

		for (i = 0; i < argsArr.length; i += 1) {
			if (typeof argsArr[i] !== "string") {
				try {
					argsArr[i] = JSON.stringify(argsArr[i]);
				} catch (e) {
					argsArr[i] = printObjImpl(argsArr[i], 0);
				}
			}
		}

		data = argsArr.join("");
		if (filestream) {
			try {
				filestream.write(new Date() + ": " + data + "\n");
			} catch (error) {
				console.error("Unable to write to file: ", error);
			}
		}

		// I want ALL my logs!
		data = data.split("\n");
		for (i = 0; i < data.length; i += 1) {
			datum = data[i];

			if (datum.length < 500) {
				console.log(datum);
			} else {
				// Do our own wrapping
				for (pos = 0; pos < datum.length; pos += 500) {
					console.log(datum.slice(pos, pos + 500));
				}
			}
		}
	}

	return {
		setFilename: function (fn) {
			if (filestream) {
				filestream.end();
			}
			if (fn) {
				try {
					filestream = fs.createWriteStream(fn, {flags: "w+"});

					filestream.on("error", function (err) {
						if (err) {
							console.error("Could not create file (error-event) " + fn, err);
						} else {
							console.error("Error..?");
						}
						filestream = false;
					});
				} catch (e) {
					console.error("Could not create file (exception) " + fn, e);
				}
			}
		},

		printObj: printObjImpl,

		log:            logBase,
		debug:          dummy,
		log_httpClient: dummy
	};
}());

module.exports = Log;
