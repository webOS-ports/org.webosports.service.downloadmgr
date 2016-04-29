var GetAllHistoryAssistant = function () { "use strict"; };

/**
 * Parameters:              Required    Type            Description
 *   owner                  No          string          AppId of process that triggered original downloads.
 *
 * Results:
 *   returnValue            Yes         boolean         true (success) or false (failure)
 *   items                  No          object array    One object for each download.
 *     completionStatusCode Yes         number          state of download, see download assistant
 *     fileExistsOnFilesys  Yes         boolean         true if file is still on filesystem (uhm?)
 *     recordString         Yes         string          string representation of download record, see download assistant. See https://github.com/isis-project/isis-browser/blob/0f2a339d30023018d1d0d435b2aa0350a32c83e4/source/DownloadList.js and determine what this really needs. Maybe also discuss with our browser guys.
 */
/*global Future */

GetAllHistoryAssistant.prototype.run = function (outerfuture) {
	"use strict";
	var args = this.controller.args, future = new Future();

	if (!args.owner) {
		outerfuture.exception = {message: "Need owner parameter.", errorCode: "illegal_arguments"};
		return;
	}

	DBManager.getByAppId(args.owner).then(function processResults(future) {
		var tickets = future.result.tickets, items = [];
		if (!tickets) {
			outerfuture.result = {items: []};
		} else {
			tickets.forEach(function checkIfFilePresent(ticket) {
				var item = {
					fileExistsOnFilesys: fs.existsSync(ticket.target),
					completionStatusCode: ticket.completionStatusCode,
					recordString: ticket.destFile
				};
			});
			outerfuture.result = {
				items: items
			}
		}
	})
};
