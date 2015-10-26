var ResumeDownloadAssistant = function () { "use strict"; };

/**
 * Parameters:              Required    Type        Description
 *   ticket                 Yes         number      Download ID returned from download method.
 *
 * Results:
 *   returnValue            Yes         boolean     true (success) or false (failure).
 *   subscribed             Yes         boolean     Was download subscribed flag.
 *   errorCode              No          string      Error message returned on failure.
 */
/*global Future */

ResumeDownloadAssistant.prototype.run = function (outerfuture) {
	"use strict";
	var args = this.controller.args, filename, future = new Future();
};
