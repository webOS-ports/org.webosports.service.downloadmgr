var ClearHistoryAssistant = function () {};

/**
 * Parameters:              Required    Type            Description
 *   owner                  No          string          AppId of process that triggered original downloads. (Can we enforce that for public bus only?)
 *
 * Results:
 *   returnValue            Yes         boolean         true (success) or false (failure)
 */

ClearHistoryAssistant.prototype.run = function (outerfuture) {
    var args = this.controller.args, filename, future = new Future();
}
