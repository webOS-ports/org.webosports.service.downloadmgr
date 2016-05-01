/*jslint node: true, nomen: true */
/*global Future, Log */

var DBManager = (function () {
	"use strict";
	var cache = {}, ticketId = 1;

	return {
		//returns ticket by id. Future -> res.returnValue = true -> res.ticket contains all data. If returnValue = false -> either error or ticket with this ID not in DB.
		getByTicket: function (ticketId) {
			var future = new Future();
			if (!ticketId) {
				future.exception = "Need ticketId.";
			} else {
				if (cache[ticketId]) {
					future.result = {
						returnValue: true,
						ticket: cache[ticketId]
					};
				} else {
					future.exception = {message: "Ticket not found.", errorCode: "ticket_not_found"};
				}
			}

			return future;
		},

		//returns ticket by appId (owner). Future -> res.returnValue = true -> res.tickets is array of tickets for this appid. If returnValue = false -> some error occured.
		getByAppId: function (appId) {
			var future = new Future(), items = [];
			if (!appId) {
				future.exception = "Need appId.";
			} else {
				//I'm too lazy for this right now..
				Objekt.keys(cache).forEach(function processTicket(ticketId) {
					if (cache[ticketId].owner === appId) {
						items.push(cache[ticketId]);
					}
				});
				future.result = {
					returnValue: true,
					tickets: items
				};
			}

			return future;
		},

		//deletes one ticket:
		deleteByTicket: function (ticketId) {
			var future = new Future();
			if (!ticketId) {
				future.exception = "Need ticketId.";
			} else {
				delete cache[ticketId];
			}

			return future;
		},

		//deletes all tickets for the specified appId
		deleteByAppId: function (appId) {
			var future = new Future();
			if (!appId) {
				future.exception = "Need appId.";
			} else {
				//I'm really too lazy for that.
				future.result = {returnValue: true};
			}

			return future;
		},

		//deletes too old tickets from history in order to avoid DB growing too big.
		//what is too old?
		//currently: file is deleted and ticket is one week old or file is not deleted but ticket is one month old (approximated by 30 days).
		purgeOldHistory: function () {
			var future = new Future();

			//we won't need that ;)
			setTimeout(function () {
				future.result = {returnValue: true};
			}, 100);

			return future;
		},

		putTicket: function (ticket) {
			var future = new Future();

			if (!ticket.ticketId) {
				ticket.ticketId = ticketId;
				ticketId += 1;
			}

			//check if necessary fields are filled.
			if (!ticket.url) {
				future.exception = "Need url in ticket.";
				return future;
			}

			//fill other fields, if not present
			ticket.sourceUrl = ticket.sourceUrl || ticket.url;
			ticket.destFile = ticket.destFile || "filename_placeholder";
			ticket.destPath = ticket.destPath || "/media/internal/downloads";
			ticket.mimetype = ticket.mimetype || "application/octet-stream"; //arbitrary binary data to put into a file.
			ticket.amountReceived = ticket.amountReceived || 0;
			ticket.amountTotal = ticket.amountTotal || -1;
			ticket.canHandlePause = ticket.canHandlePause || false;
			ticket.completionStatusCode = ticket.completionStatusCode || -1;
			ticket.httpStatus = ticket.httpStatus || 0;
			ticket.interrupted = ticket.interrupted || false;
			ticket.completed = ticket.completed || false;
			ticket.aborted = ticket.aborted || false;
			ticket.target = ticket.target || (ticketData.$destPath + "/" + ticketData.$destFile);
			ticket.owner = ticket.owner || "org.webosports.service.downloadmgr"; //use this as owner, if no owner in ticket.
			ticket.interface = ticket["interface"] || "wifi"; //use wifi as default...? Not sure we can handle that at all.
			ticket.startTime = ticket.startTime || Date.now();

			cache[ticket.ticketId] = ticket;
			setTimeout(function () {
				future.result = {returnValue: true, id: ticket.ticketId};
			}, 100);

			return future;
		},

		loadDatabase: function (dbFile) {
			var future = new Future();

			//we won't need that ;)
			setTimeout(function () {
				future.result = {returnValue: true};
			}, 100);

			return future;
		}
	};
}());

if (typeof module !== "undefined") { //allow to "require" this file.
	module.exports = DBManager;
}
