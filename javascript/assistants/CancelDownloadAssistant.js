/*global Future */
var CancelDownloadAssistant = function () { "use strict"; };

/**
 * Parameters:              Required    Type        Description
 *   ticket                 Yes         number      Download ID returned from download method.
 *
 * Results:
 *   ticket                 Yes         number      Passed download ID.
 *   returnValue            Yes         boolean     true (success) or false (failure).
 *   subscribed             Yes         boolean     Was download subscribed flag.
 *   aborted                No          boolean     Was download aborted flag.
 *   completed              No          boolean     Was download completed flag.
 *   completionStatusCode   No          number      Completion status code:
                                                        -1 -- General error
                                                        -2 -- Connect timeout
                                                        -3 -- Corrupt file
                                                        -4 -- File system error
                                                        -5 -- HTTP error
                                                        11 -- Interrupted
                                                        12 -- Cancelled
 *   errorCode              No          string      Error message returned on failure.
 */

CancelDownloadAssistant.prototype.run = function (outerfuture) {
	"use strict";
	var args = this.controller.args, future = new Future();

	if (!args.ticket) {
		outerfuture.exception = {message: "Need ticket parameter.", errorCode: "illegal_arguments"};
		return;
	}

	Downloader.cancel(args.ticket);
	DBManager.getByTicket(args.ticket).then(function deleteFile(future) {
		if (future.exception) {
			outerfuture.exception = future.exception;
		} else {
			var ticket = future.result.ticket;
			ticket.aborted = true;
			DBManager.putTicket(ticket);
			if (ticket.tempFile) {
				fs.unlink(ticket.tempFile, function (err) {
					if (err && err.code !== "ENOENT") { //if not there, then all is fine.
						outerfuture.exception = {message: err.message, errorCode: err.code};
					} else {
						ticket.tempFile = false;
						DBManager.putTicket(ticket);
						outerfuture.result = ticket;
					}
				});
			} else {
				//file was already done?
				//should we delete here, too?
				//TODO: we do not yet check if file already exists -> could be abused to delete files!
				outerfuture.result = ticket;
			}
		}
	});
};
