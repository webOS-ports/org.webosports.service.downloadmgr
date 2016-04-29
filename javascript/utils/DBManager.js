/*jslint node: true, nomen: true */
/*global Future, Log */

var sqlite3 = require("sqlite3").verbose();

var DBManager = (function () {
	"use strict";
	var database,
		cache = {};

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
					database.get("SELECT * FROM tickettable WHERE ticketId IS $ticketId", {
						$ticketId: ticketId
					}, function getCB(err, row) {
						if (err) {
							future.exception = {message: "SQLITE Error: " + JSON.stringify(err), errorCode: "sqlite_error"};
						} else if (!row) {
							future.exception = {message: "Ticket not found.", errorCode: "ticket_not_found"};
						} else {
							future.result = {
								returnValue: true,
								ticket: row
							};
						}
					});
				}
			}

			return future;
		},

		//returns ticket by appId (owner). Future -> res.returnValue = true -> res.tickets is array of tickets for this appid. If returnValue = false -> some error occured.
		getByAppId: function (appId) {
			var future = new Future();
			if (!appId) {
				future.exception = "Need appId.";
			} else {
				//Have a hard limit of 100 most recent entries here. We don't want this to potentially fill all our memory, right?
				//I don't think this is important enough to implement a "ticket" system, right?
				database.all("SELECT * FROM tickettable WHERE owner IS $appId ORDER BY startTime DESC LIMIT 100", {
					$appId: appId
				}, function getCB(err, rows) {
					if (err || !rows) {
						future.exception = "SQLITE Error: " + JSON.stringify(err);
					} else {
						future.result = {
							returnValue: true,
							tickets: rows
						};
					}
				});
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
				database.run("DELETE FROM tickettable WHERE ticketId IS $ticketId", {
					$ticketId: ticketId
				}, function deleteCB(err) {
					if (err) {
						future.exception = "SQLITE Error: " + JSON.stringify(err);
					} else {
						future.result = {returnValue: true};
					}
				});
			}

			return future;
		},

		//deletes all tickets for the specified appId
		deleteByAppId: function (appId) {
			var future = new Future();
			if (!appId) {
				future.exception = "Need appId.";
			} else {
				database.run("DELETE FROM tickettable WHERE owner IS $appId", {
					$appId: appId
				}, function deleteCB(err) {
					if (err) {
						future.exception = "SQLITE Error: " + JSON.stringify(err);
					} else {
						Log.debug("Deleted ", this.changes, " rows for app ", appId);
						future.result = {returnValue: true};
					}
				});
			}

			return future;
		},

		//deletes too old tickets from history in order to avoid DB growing too big.
		//what is too old?
		//currently: file is deleted and ticket is one week old or file is not deleted but ticket is one month old (approximated by 30 days).
		purgeOldHistory: function () {
			var future = new Future(), oneWeek = Date.now() - 7 * 24 * 60 * 60 * 1000, oneMonth = Date.now() - 30 * 24 * 60 * 60 * 1000,
				fs = require("fs");

			database.run("DELETE FROM tickettable WHERE startTime < $oneMonth", {$oneMonth: oneMonth}, function deleteCB(err) {
				if (err) {
					future.exception = "SQLITE Error: " + JSON.stringify(err);
				} else {
					Log.debug("OneMonth cleanup deleted ", this.changes, " rows.");
					future.result = {returnValue: true};
				}
			});

			future.then(function deleteOneWeekOldIfFilesAreGone() {
				var result = future.result, //consume result and, if it was exception, error out here, too.
					innerFuture = new Future(),
					deleteCount = 0;
				database.each("SELECT ticketId, target FROM tickettable WHERE startTime < $oneWeek", {$oneWeek: oneWeek}, function processOneEntry(error, row) {
					if (error) {
						Log.log("Got error from db: ", error);
						future.exception = "SQLITE Error: " + JSON.stringify(error);
					} else {
						innerFuture.then(function innerProcessOneEntry() {
							var result = innerFuture.result;

							fs.access(row.target, function existsCB(err) {
								if (err) { //file probably does not exist anymore..
									Log.debug("Deleting ", row.ticketId);
									database.run("DELETE FROM tickettable WHERE ticketId IS $ticketId", {$ticketId: row.ticketId}, function delCB(err) {
										if (err) {
											Log.debug("Error in delete: ", err);
										}
									});
									deleteCount += 1;
								} else {
									Log.debug("File ", row.target, " for ", row.ticketId, " still exists. Keep ticket.");
								}
								innerFuture.result = {go: true}; //next, please.
							});
						});
					}
				}, function dbComplete(error, numRows) {
					if (error) {
						Log.log("Got error from db (in dbComplete): ", error);
						future.exception = "SQLITE Error: " + JSON.stringify(error);
					} else {

						innerFuture.then(function allDone() {
							if (innerFuture.exception) {
								future.exception = innerFuture.exception;
							} else {
								Log.debug("Cleanup done. Processed ", numRows, " rows in week cleanup. Deleted: ", deleteCount);
								future.result = {retrunValue: true}; //all went well.
							}
						});

						innerFuture.result = {go: true}; //let them fly!
					}
				});
			});

			return future;
		},

		putTicket: function (ticket) {
			var future = new Future(),
				ticketData = {},
				update = false;

			//if we have a ticketId, update values. Otherwise this is a new value and we need to store ticketId in it, too.
			if (ticket.ticketId) {
				update = true;
				ticketData.$ticketId = ticket.ticketId;
			}

			//check if necessary fields are filled.
			if (!ticket.url) {
				future.exception = "Need url in ticket.";
				return future;
			}
			ticketData.$url = ticket.url;

			//fill other fields, if not present
			ticketData.$sourceUrl = ticket.sourceUrl || ticket.url;
			ticketData.$destFile = ticket.destFile || "filename_placeholder";
			ticketData.$destPath = ticket.destPath || "/media/internal/downloads";
			ticketData.$mimetype = ticket.mimetype || "application/octet-stream"; //arbitrary binary data to put into a file.
			ticketData.$amountReceived = ticket.amountReceived || 0;
			ticketData.$amountTotal = ticket.amountTotal || -1;
			ticketData.$canHandlePause = ticket.canHandlePause || false;
			ticketData.$completionStatusCode = ticket.completionStatusCode || -1;
			ticketData.$httpStatus = ticket.httpStatus || -1;
			ticketData.$interrupted = ticket.interrupted || false;
			ticketData.$completed = ticket.completed || false;
			ticketData.$aborted = ticket.aborted || false;
			ticketData.$target = ticket.target || (ticketData.$destPath + "/" + ticketData.$destFile);
			ticketData.$owner = ticket.owner || "org.webosports.service.downloadmgr"; //use this as owner, if no owner in ticket.
			ticketData.$interface = ticket["interface"] || "wifi"; //use wifi as default...? Not sure we can handle that at all.
			ticketData.$startTime = ticket.startTime || Date.now();

			if (!update) {
				database.run("INSERT INTO tickettable (url, sourceUrl, destFile, destPath, mimetype, amountReceived, amountTotal, canHandlePause, completionStatusCode, httpStatus, interrupted, completed, aborted, target, owner, interface, startTime) VALUES ($url, $sourceUrl, $destFile, $destPath, $mimetype, $amountReceived, $amountTotal, $canHandlePause, $completionStatusCode, $httpStatus, $interrupted, $completed, $aborted, $target, $owner, $interface, $startTime)", ticketData,
					function putCB(err) {
						if (err) {
							future.exception = "SQLITE Error: " + JSON.stringify(err);
						} else {
							if (this.lastID >= 0) {
								Log.debug("Inserted ticket with ", this.lastID, " id.");
								ticket.ticketId = this.lastID;
								ticketData.$ticketId = this.lastID;
								cache[ticket.ticketId] = ticket;
								future.result = {returnValue: true, id: this.lastID};
							} else {
								Log.log("No id after insert. Something must have gone wrong...?");
								future.exception = "SQLITE Error: Insert failed, no ID returned.";
							}
						}
					});
			} else {
				//do an update:
				database.run("UPDATE tickettable SET url = $url, sourceUrl = $sourceUrl, destFile = $destFile, destPath = $destPath, mimetype = $mimetype, amountReceived = $amountReceived, amountTotal = $amountTotal, canHandlePause = $canHandlePause, completionStatusCode = $completionStatusCode, httpStatus = $httpStatus, interrupted = $interrupted, completed = $completed, aborted = $aborted, target = $target, owner = $owner, interface = $interface, startTime = $startTime) WHERE ticketId = $ticketId", ticketData,
					function putCB(err) {
						if (err) {
							future.exception = "SQLITE Error: " + JSON.stringify(err);
						} else {
							Log.debug("Updated ticket with ", ticketData.$ticketId, " id, affected: ", this.changes);
							cache[ticket.ticketId] = ticket;
							future.result = {returnValue: true, id: ticketData.$ticketId};
						}
					});
			}

			return future;
		},

		loadDatabase: function (dbFile) {
			var future = new Future();

			database = new sqlite3.Database(dbFile);

			database.on("error", function dabaseOpenFail(err) {
				Log.log("Error opening database: ", err);
				future.exception = "SQLITE Error: " + JSON.stringify(err);
			});

			database.on("open", function databaseOpened() {
				future.result = { returnValue: true };
			});

			future.then(function checkIfTablesAreRead() {
				var result = future.result;
				if (result.returnValue) {
					//check if table already exists:
					database.all("SELECT name FROM sqlite_master WHERE type='table'", function checkTableCB(err, rows) {
						if (err) {
							future.exception = "SQLITE Error: " + JSON.stringify(err);
						} else {
							Log.debug("Got rows from check if table is there: ", rows);
							//decide how to go on, if table is there, finish, if not, create tables.
							future.result = { returnValue: true, createTable: rows.length === 0 };
						}
					});
				} else {
					future.result = result;
				}
			});

			//create table, if not present:
			future.then(function createTablesIfNecessary() {
				var result = future.result;
				if (result.returnValue && result.createTable) {
					database.run("CREATE TABLE tickettable(" +
								 "ticketId INTEGER PRIMARY KEY," +	//id, returned to app and required from app to do anything with ticket
								 "url TEXT," +						//real url of download
								 "sourceUrl TEXT," +				//url originally given to service
								 "destFile TEXT," +					//target file
								 "destPath TEXT," +					//target path, usually /media/internal/downloads
								 "mimetype TEXT," +					//mimetype
								 "amountReceived INTEGER," +		//Bytes received
								 "amountTotal INTEGER," +			//total bytes to download
								 "canHandlePause BOOLEAN," +		//default: false, true if pause possible
								 "completionStatusCode INTEGER," +	//see DownloadStatusQueryAssistant or similar.
								 "httpStatus INTEGER," +			//http status code
								 "interrupted BOOLEAN," +			//true if something went wrong.
								 "completed BOOLEAN," +				//true if done
								 "aborted BOOLEAN," +				//ture if aborted
								 "target TEXT," +					//complete path to file
								 "owner TEXT," +					//appId of owner
								 "interface TEXT," +				//interface used, i.e. "wifi".
								 "startTime INTEGER" +				//start time of download, for book keeping stuff.
								 ");", function (err) {
							if (err) {
								future.exception = "SQLITE Error: " + JSON.stringify(err);
							} else {
								future.result = {returnValue: true};
							}
						});
				} else {
					future.result = result;
				}
			});

			return future;
		}
	};
}());

if (typeof module !== "undefined") { //allow to "require" this file.
	module.exports = DBManager;
}
