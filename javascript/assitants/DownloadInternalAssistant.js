var DownloadInternalAssistant = function () { "use strict"; };

/**
 * Internal Assistant to really do a download.
 * This will only return after the download is done or aborted.
 * This should be run from an activity that keeps the device awake (at least network)
 * and the service running in background.
 */
/*global Future */

DownloadInternalAssistant.prototype.run = function (outerfuture, subscription) {
	"use strict";
	var args = this.controller.args, future = new Future(), options;

	if (!args.target) {
		outerfuture.exception = { errorCode: -1, errorText: "Need target parameter.", subscribed: args.subscribe };
		return;
	}

	function progressCallback(progress) {
		if (args.subscribe) {
			var future = subscription.get();
			if (future) {
				if (!progress.finished) {
					future.result = {
						returnValue: true,
						ticket: 0,
						amountReceived: 128,
						amountTotal: 1024
					};
				} else {
					future.result = {
						returnValue: true,
						ticket: 0,
						url: "",
						sourceUrl: "",
						destTempPrefix: ".",
						destFile: "welcome.html",
						destPath: "/media/internal/downloads/",
						subscribed: args.subscribe
					};
				}
			}
		}
	}

	options = {
		url: args.target,
		mime: args.mime,
		cookieHeader: args.cookieHeader,
		targetDir: args.targetDir,
		targetFilename: args.targetFilename,
		keepFilenameOnRedirect: !!args.keepFilenameOnRedirect,
		canHandlePause: !!args.canHandlePause,
		progressCallback: progressCallback
	};

	//set outerfuture result after request is send.
	outerfuture.result = {
		returnValue: true,
		ticket: 0,
		url: "http://",
		target: "/media/internal/downloads/blubbel.txt"
	};

	return outerfuture;
};

