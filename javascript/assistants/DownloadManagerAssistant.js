/* ServiceAssistant
* This assistant is called before anything within the service.
* It sets up the sqlite db if necessary and does some cleaning operations, too.
*/
/*jslint node: true */
/*global Config, Future, fs, DBManager, Log */

var DownloadManagerAssistant = function () {
	"use strict";
};

DownloadManagerAssistant.prototype.setup = function () {
	"use strict";
	var future = new Future(), outerFuture = new Future(), masterkey;

	fs.access(Config.dbFolder, function createDirIfNecessary(exists) {
		if (!exists) {
			fs.mkdir(Config.dbFolder, function (err) {
				if (err) {
					future.result = { returnValue: false, error: err};
				} else {
					future.result = { returnValue: true };
				}
			});
		} else {
			future.result = { returnValue: true };
		}
	});

	future.then(this, function loadDatabase() {
		var result = future.result;
		if (result.returnValue) {
			future.nest(DBManager.loadDatabase(Config.dbFile));
		} else {
			future.result = result;
		}
	});

	future.then(this, function cleanUpOldEntries() {
		var result = future.result;
		if (result.returnValue) {
			future.nest(DBManager.purgeOldHistory());
		} else {
			future.result = result;
		}
	});

	future.then(this, function end() {
		var result, error = false;
		if (future.exception) {
			error = true;
			result = future.exception;
		} else {
			result = future.result;
		}
		Log.debug("Startup done " + (error ? "with error (!!!):" : ":"), result);
		outerFuture.result = { returnValue: !!error };
	});

	return outerFuture;
};
