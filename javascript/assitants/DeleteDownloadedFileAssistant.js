var DeleteDownloadedFileAssistant = function () {};

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
    var args = this.controller.args, filename, future = new Future();
}
