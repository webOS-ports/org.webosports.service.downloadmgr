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

