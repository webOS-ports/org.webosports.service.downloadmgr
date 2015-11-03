var DownloadInternalAssistant = function () { "use strict"; };

/**
 * Internal Assistant to really do a download.
 * This will only return after the download is done or aborted.
 * This should be run from an activity that keeps the device awake (at least network)
 * and the service running in background.
 *
 * Accepts full options for download or just ticketId (which is produced by download assistant).
 * DownloadAssistant calls with this parameters:
 *  ticketId = id of ticket
 *  cookieHeaders
 *  keepFilenameOnRedirect
 *
 */
/*global checkResult, DBManager, Downloader, Future, Log */

DownloadInternalAssistant.prototype.run = function (outerfuture, subscription) {
	"use strict";
	var args = this.controller.args, future = new Future(), options, ticket, lastSend = Date.now();

	if (!args.target && !args.ticketId) {
		outerfuture.exception = "Need target or ticketId parameter.";
		return;
	}

	Log.debug("Internal download started with: ", args);

	function progressCallback(progress) {
		if (args.subscribe && Date.now() - lastSend > 1000) { //once a second should be more than enough.
			var future = subscription.get();
			if (future) {
				future.result = {
					returnValue: true,
					ticket: ticket.ticketId,
					amountReceived: ticket.amountReceived,
					amountTotal: ticket.amountTotal
				};
				lastSend = Date.now();
			}
		}

	}

	//get a ticket from db (if no ticket, yet, put into db in order to get ID first).
	if (args.ticketId) {
		Log.debug("Getting by ticketId: ", args.ticketId);
		future.nest(DBManager.getByTicket(args.ticketId));
	} else {
		ticket = {
			url: args.target,
			mimetype: args.mime,
			destPath: args.targetDir,
			destFile: args.targetFilename,
			canHandlePause: !!args.canHandlePause
		};
		Downloader.getFilename({ticket: ticket}); //let's fill up path and filename from url.
		Log.debug("Putting new ticket: ", ticket);
		future.nest(DBManager.putTicket(ticket));

		future.then(this, function putTicketDone() {
			var result = future.result;
			Log.debug("Got ticketId: ", result);
			if (result.id >= 0) {
				future.nest(DBManager.getByTicket(result.id));
			} else {
				outerfuture.exception = result.error;
			}
		});
	}

	future.then(this, function processTicketIntoOptions() {
		var result = future.result;
		Log.debug("Processing ticket ", result, " into options object.");
		if (result.ticket) {
			options = {
				url: result.ticket.url,
				mime: result.ticket.mimetype,
				cookieHeader: args.cookieHeader,
				targetDir: result.ticket.destPath,
				targetFilename: result.ticket.destFile,
				target: result.ticket.target,
				keepFilenameOnRedirect: !!args.keepFilenameOnRedirect,
				canHandlePause: result.ticket.canHandlePause,
				receivedCallback: args.subscribe ? progressCallback : undefined,
				ticket: result.ticket
			};
			ticket = result.ticket;

			Log.debug("Starting download with ", options);
			future.nest(Downloader.download(options));
		} else {
			outerfuture.exception = "Something went wrong with download: " + JSON.stringify(result.error);
			return;
		}
	});

	future.then(this, function downloadDone() {
		var result = checkResult(future);
		Log.debug("Download done: ", result);

		//set outerfuture result after request is done.
		outerfuture.result = {
			returnValue: true,
			ticket: ticket.ticketId
		};

		//not sure we are supposed to do this here.. but how to tell the client that we are done?
		if (args.subscribe) {
			this.controller.cancelSubscription();
		}
	});

	return outerfuture;
};

