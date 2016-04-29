/*global Future */
var ClearHistoryAssistant = function () { "use strict"; };

/**
 * Parameters:              Required    Type            Description
 *   owner                  No          string          AppId of process that triggered original downloads. (Can we enforce that for public bus only?)
 *
 * Results:
 *   returnValue            Yes         boolean         true (success) or false (failure)
 */

ClearHistoryAssistant.prototype.run = function (outerfuture) {
	"use strict";
	var args = this.controller.args, future = new Future();

	if (!args.owner) {
		outerfuture.exception = {message: "Need owner parameter.", errorCode: "illegal_arguments"};
		return;
	}

	outerfuture.nest(DBManager.deleteByAppId(args.owner));
};
