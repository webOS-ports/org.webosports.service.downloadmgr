var ListPendingAssistant = function () { "use strict"; };

/**
 * Parameters:              Required    Type        Description
 *   None.
 *
 * Results:
 *   returnValue            Yes         boolean         true (success) or false (failure)
 *   count                  No          number          Number of downloads in progress.
 *   downloads              No          object array    One object for each pending download. This object is absent if there are no pending downloads.
 */
/*global Future */

ListPendingAssistant.prototype.run = function (outerfuture) {
	"use strict";
	var args = this.controller.args, filename, future = new Future();
};
