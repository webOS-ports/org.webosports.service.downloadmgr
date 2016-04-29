var UploadAssistant = function () { "use strict"; };

/**
 * Parameters:              Required    Type        Description
 *   fileName               Yes         string      Path to the local file to be uploaded.
 *   url                    Yes         string      The URL to which to post the file.
 *   fileLabel              No          string      The label portion of the file name (as opposed to the file extension).
 *   contentType            No          string      The MIME type of the file.
 *   postParameters         No          object      An object containing key/data/content triplets to support parameters required by the server to which the file is uploaded. See 3 fields below.
 *      key                 No          string      Header name.
 *      data                No          string      Header value.
 *      contentType         No          string      Header value type. Default is text/plain.
 *   cookies                No          object      Key-value pairs that carry additional optional information with the upload, in the format: cookies: { "key1": "val1", "key2": "val2", ...}
 *   customHttpHeaders      No          object      Values to include in the HTTP headers, in the format: customHttpHeaders: [ "val1", "val2", ...]
 *   subscribe              No          boolean     If set to true, upload() calls the onSuccess handler periodically with updates during the file upload. If set to false, calls the onSuccess handler only when the upload request is sent.
 *
 * Results:
 *   ticket                 Yes         number      Passed download ID.
 *   returnValue            Yes         boolean     true (success) or false (failure).
 *   sourceFile             No          string      Path to the local file uploaded.
 *   url                    No          string      URI of the downloaded file.
 *   completionStatusCode   No          number      Completion status code:
                                                         0 -- Success
                                                        -1 -- General error
                                                        -2 -- Connect timeout
                                                        -3 -- Corrupt file
                                                        -4 -- File system error
                                                        -5 -- HTTP error
                                                        11 -- Interrupted
                                                        12 -- Cancelled
 *   completed              No          boolean     true if download is complete.
 *   httpCode               No          number      HTTP return code, as described at http://www.w3.org/Protocols/HTTP/HTRESP.html
 *   responseString         No          string      Server response to the POST request.
 *   location               No          string      Uploaded file location.
 *   errorCode              No          string      Error code returned on failure.
 *   subscribed             Yes         boolean     Set to true if subscribed to downloads from that URI.
 */
/*global Future */

UploadAssistant.prototype.run = function (outerfuture) {
	"use strict";
	var args = this.controller.args, future = new Future();

	outerfuture.exception = {message: "Not yet implemented.", errorCode: "not_implemented"};
};
