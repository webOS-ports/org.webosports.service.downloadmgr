/*jslint node: true */

var Config = {
	//file path for sqlite database to store ticket information
	dbFolder: "/var/palm/",
	dbFilename: "downloadManager.db",

	//temporary download prefix:
	destTempPrefix: ".part."
};

if (Config.dbFolder.charAt(Config.dbFolder.length - 1) !== "/") {
	Config.dbFolder += "/";
}

Config.dbFile = Config.dbFolder + Config.dbFilename;

module.exports = Config;
