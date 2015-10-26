/* ServiceAssistant
* This assistant is called before anything within the service.
* It sets up the sqlite db if necessary and does some cleaning operations, too.
*/
/*jslint node: true */
/*global Config, Future, fs, DBManager */

var KeyManagerServiceAssistant = function () {
	"use strict";
};

KeyManagerServiceAssistant.prototype.setup = function () {
	"use strict";
	var future = new Future(), masterkey;

	fs.exists(Config.dbFolder, function createDirIfNecessary(exists) {
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

	return future;
};
