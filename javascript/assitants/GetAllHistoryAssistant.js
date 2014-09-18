var GetAllHistoryAssistant = function () {};

/**
 * Parameters:              Required    Type            Description
 *   owner                  No          string          AppId of process that triggered original downloads.
 *
 * Results:
 *   returnValue            Yes         boolean         true (success) or false (failure)
 *   items                  No          object array    One object for each download.
 *     state                Yes         string          state of download, see download assistant
 *     fileExistsOnFilesys  Yes         boolean         true if file is still on filesystem (uhm?)
 *     recordString         Yes         string          string representation of download record, see download assistant. See https://github.com/isis-project/isis-browser/blob/0f2a339d30023018d1d0d435b2aa0350a32c83e4/source/DownloadList.js and determine what this really needs. Maybe also discuss with our browser guys.
 */

GetAllHistoryAssistant.prototype.run = function (outerfuture) {
    var args = this.controller.args, filename, future = new Future();
}
