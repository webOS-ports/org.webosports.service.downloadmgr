/*exported Future, Log, fs, httpClient, checkResult, servicePath */
/*global IMPORTS, console, require:true, process */


//some global config:
var dbFolder = "/var/palm/";
var dbFile = dbFolder + "downloadManager.db";

console.error("Starting to load libraries");

//now add some node.js imports:
if (typeof require === "undefined") {
	require = IMPORTS.require;
}
var fs = require("fs"); //required for own node modules and current vCard converter.

//node in webos is a bit picky about require paths. Really point it to the library here.
var servicePath = fs.realpathSync(".");
var libraryPath = servicePath + "/javascript/utils";
console.log("Service Path: " + servicePath);
var Future = require(servicePath + "/javascript/Future");
var Log = require(libraryPath + "Log.js");
Log.setFilename("/media/internal/.org.webosports.service.downloadManager.log");
var httpClient = require(libraryPath + "httpClient.js");
httpClient.setTimeoutDefault(300000);
var checkResult = require(libraryPath + "checkResult.js");
var DBManager = require(libraryPath + "DBManager.js");

console.error("--------->Loaded Libraries OK");

process.on("uncaughtException", function (e) {
	"use strict";
	Log.log("Uncaought error:" + e.stack);
	Log.log("Will exit now.");
	process.exit();
});

