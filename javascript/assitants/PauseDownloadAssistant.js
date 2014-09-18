var PauseDownloadAssistant = function () {};

/**
 * Parameters:              Required    Type        Description
 *   ticket                 Yes         number      Download ID returned from download method.
 *
 * Results:
 *   returnValue            Yes         boolean     true (success) or false (failure).
 *   subscribed             Yes         boolean     Was download subscribed flag.
 *   errorCode              No          string      Error message returned on failure.
 */

PauseDownloadAssistant.prototype.run = function (outerfuture) {
    var args = this.controller.args, filename, future = new Future();
}
