var DownloadStatusQueryAssistant = function () { "use strict"; };

/**
 * Parameters:              Required    Type        Description
 *   ticket                 Yes         number      Download ID returned from download method.
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
 *   mimetype               No          string      File's MIME type.
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
 *   owner                  No          string      ID and PID of app requesting download.
 *   interface              No          string      Interface name, i.e., "wifi". //NOT SURE WE CAN SUPPORT THAT!
 *   state                  No          string      Download state
 *   errorCode              No          string      Error code returned on failure.
 *   subscribed             Yes         boolean     Set to true if subscribed to downloads from that URI.

 */
/*global Future */

DownloadStatusQueryAssistant.prototype.run = function (outerfuture) {
	"use strict";
	var args = this.controller.args, filename, future = new Future();
};
