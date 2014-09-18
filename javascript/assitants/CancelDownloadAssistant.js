var CancelDownloadAssistant = function () {};

/**
 * Parameters:              Required    Type        Description
 *   ticket                 Yes         number      Download ID returned from download method.
 *
 * Results:
 *   ticket                 Yes         number      Passed download ID.
 *   returnValue            Yes         boolean     true (success) or false (failure).
 *   subscribed             Yes         boolean     Was download subscribed flag.
 *   aborted                No          boolean     Was download aborted flag.
 *   completed              No          boolean     Was download completed flag.
 *   completionStatusCode   No          number      Completion status code:
                                                        -1 -- General error
                                                        -2 -- Connect timeout
                                                        -3 -- Corrupt file
                                                        -4 -- File system error
                                                        -5 -- HTTP error
                                                        11 -- Interrupted
                                                        12 -- Cancelled
 *   errorCode              No          string      Error message returned on failure.
 */

CancelDownloadAssistant.prototype.run = function (outerfuture) {
    var args = this.controller.args, filename, future = new Future();
}
