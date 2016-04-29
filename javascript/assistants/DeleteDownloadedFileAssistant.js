/*global Future */
var DeleteDownloadedFileAssistant = function () { "use strict"; };

/**
 * Parameters:              Required    Type        Description
 *   ticket                 Yes         number      Download ID returned from download method.
 *
 * Results:
 *   ticket                 Yes         number      Passed download ID.
 *   returnValue            Yes         boolean     true (success) or false (failure).
 *   errorCode              No          string      Error message returned on failure.
 */

DeleteDownloadedFileAssistant.prototype.run = function (outerfuture) {
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
			var ticket = future.result.ticket, filename;
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
				fs.unlink(ticket.target, function (err) {
					if (err && err.code !== "ENOENT") { //if not there, then all is fine.
						outerfuture.exception = {message: err.message, errorCode: err.code};
					} else {
						outerfuture.result = ticket;
					}
				});
			}
		}
	});
};
