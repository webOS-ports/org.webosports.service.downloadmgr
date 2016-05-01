/*global Downloader, Log, DBManager, Config */
var DownloadAssistant = function () { "use strict"; };

/**
 * Parameters:              Required    Type        Description
 *   target                 Yes         string      URL of the form "http://file" or "https://file" where file is a well-formed URI targeting a downloadable file.
 *   mime                   No          string      File's MIME type
 *   cookieHeader           No          string      Sets the cookie header for the request, i.e., "foo=bar", or, for multiple cookies, "foo=bar;red=blue;night=day".
 *   targetDir              No          string      The local directory to save the file. This directory must be beneath /media/internal and defaults to /media/internal/downloads if not specified.
 *   targetFilename         No          string      The local file name to use when saving the file. Defaults to file name specified in target.
 *   keepFilenameOnRedirect No          boolean     When the download URL redirects, setting keepFilenameOnRedirect to true preserves the original target filename. This parameter is ignored if targetFilename is specified.
 *   subscribe              No          boolean     If true, the onSuccess handler is called periodically with updates during the file download. Otherwise, the onSuccess handler is only called once when the download request is sent (not when the download completes). Default is false.
 *   canHandlePause         No          boolean     If true, you can use the pause/resume APIs with this download. Default is false.
 *
 * Results:
 *   ticket                 Yes         number      Passed download ID.
 *   returnValue            Yes         boolean     true (success) or false (failure).
 *   url                    No          string      URI of the downloaded file.
 *   sourceUrl              No          string      URI of the downloaded file.
 *   deviceId               No          string      Used in App Catalog downloads.
 *   authToken              No          string      Used in App Catalog downloads.
 *   destTempPrefix         No          string      A file is downloaded as a temporary file first -- "<destPath> + <destTempPrefix> + <destFile>" -- and when the file completes, it is renamed to <destPath> + <destFile>.
 *   destFile               No          string      Name of downloaded file on device.
 *   destPath               No          string      Path to downloaded file on device.
 *   subscribed             Yes         boolean     Set to true if subscribed to downloads from that URI.
 *   amountReceived         No          number      Number of bytes received so far.
 *   amountTotal            No          number      Total number of bytes downloaded.
 *   canHandlePause         No          boolean     Pause and resume functions can be used during download flag.
 *   completionStatusCode   No          number      Completion status code:
														-1 -- General error
														-2 -- Connect timeout
														-3 -- Corrupt file
														-4 -- File system error
														-5 -- HTTP error
														11 -- Interrupted
														12 -- Cancelled
														200 -- Success
														...Other HTTP return codes (besides 200)...
 *   httpStatus             No          number      Returns the request's actual HTTP status code without filtering. For example, if a file was not found on the server, it would be "404" (not found). If that was the case, completionStatusCode would be "-5".
 *   interrupted            No          boolean     true if download was interrupted.
 *   completed              No          boolean     true if download is complete.
 *   aborted                No          boolean     Was download aborted flag.
 *   target                 No          string      Path to the local downloaded file.
 *   mimetype               No          string      File's MIME type.
 *   errorCode              No          string      Error code returned on failure.
 *   errorText              No          string      Error message returned on failure.
 */
/*global Future */

DownloadAssistant.prototype.run = function (outerfuture, subscription) {
	"use strict";
	var args = this.controller.args, future = new Future(), options, ticket, lastSend = 0, appId, isPrivileged;

	if (!args.target) {
		outerfuture.exception = {message: "Need target parameter.", errorCode: "illegal_arguments"};
		return;
	}

	appId = this.controller.message.applicationID().split(" ")[0];
	if (!appId) {
		appId = this.controller.message.senderServiceName();
	}
	isPrivileged = appId.indexOf("org.webosports") === 0 || appId.indexOf("com.palm") === 0;

	function progressCallback(future) {
		var exception = future.exception, progress = future.result;
		if (progress) {
			progress = progress.ticket;
			progress.ticket = progress.ticketId;
		}
		Log.debug("Progress: ", progress);
		Log.debug("Exception: ", exception);
		if (args.subscribe) {
			var future = subscription.get();
			if (future) {
				/*
				future.result = {
					returnValue: true,
					ticket: ticket.ticketId,
					amountReceived: ticket.amountReceived,
					amountTotal: ticket.amountTotal
				};*/
				progress.ticket = progress.ticketId;
				future.result = progress;
				lastSend = Date.now();
			}
		}

		if (progress && !(progress.completed || progress.aborted || progress.interrupted)) {
			setTimeout(deliverProgress.bind(this), 500);
		} else {
			Log.debug("Final result. Cancel subscription:");
			this.controller.cancelSubscription();
			outerfuture.result = progress;
		}
	}

	function deliverProgress() {
		DBManager.getByTicket(ticket.ticketId).then(progressCallback.bind(this));
	}

	options = {
		cookieHeader: args.cookieHeader,
		keepFilenameOnRedirect: !!args.keepFilenameOnRedirect
	};

	ticket = {
		url: args.target,
		mimetype: args.mime,
		destFile: args.targetFilename,
		destPath: args.targetDir,
		canHandlePause: !!args.canHandlePause
	};
	Downloader.getFilename({ticket: ticket, privileged: isPrivileged, owner: appId}); //let's fill up path and filename from url.
	Log.debug("Putting new ticket: ", ticket);
	future.nest(DBManager.putTicket(ticket));

	future.then(this, function putTicketDone() {
		var result = future.result, resultFuture;
		Log.debug("Got ticketId: ", result);
		if (result.id >= 0) {
			ticket.ticketId = result.id;
			options.ticketId = result.id;

			//ticket is stored. Build activity so that activity manager keeps device "awake"
			//and service running and allow this assistant to return directly.
			//subscribe if args.subscribe.
			PalmCall.call("palm://com.palm.activitymanager/", "create", {
				activity: {
					name: "download" + ticket.ticketId,
					description: "Download activity for ticket " + ticket.ticketId,
					type: {
						//foreground: true,
						immediate: true,
						priority: "low", //will this cause issues?
						userInitiated: true,
						pausable: ticket.canHandlePause,
						cancellable: false,
						power: true,
						powerDebounce: true
					},
					callback: {
						method: "palm://com.palm.downloadmanager/downloadInternal",
						params: {
							ticketId: ticket.ticketId,
							privileged: isPrivileged,
							subscribe: true //this is necessary in order to protect downloadInternal command from timeout.
						}
					}
				},
				start: true
			});

			if (args.subscribe && subscription) {
				resultFuture = subscription.get();
			}
			if (!resultFuture) {
				//not subscribed or coult not get subscription future
				resultFuture = outerfuture;
			} else {
				//subscription active, deliver status in interval:
				setTimeout(deliverProgress.bind(this), 50);
			}

			//set outerfuture result after request is send, i.e. will return now.
			resultFuture.result = {
				returnValue: true,
				ticket: ticket.ticketId,
				url: ticket.url,
				sourceUrl: ticket.sourceUrl,
				destTempPrefix: Config.destTempPrefix,
				destFile: ticket.destFile,
				destPath: ticket.destPath,
				subscribed: args.subscribe,
				target: ticket.target
			};
		} else {
			outerfuture.exception = result.error;
		}
	});

	return outerfuture;
};

