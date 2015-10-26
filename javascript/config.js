var Config = {
	//file path for sqlite database to store ticket information
	dbFolder: "/var/palm/",
	dbFile: dbFolder + "downloadManager.db",

	//temporary download prefix:
	destTempPrefix: ".part."
}

module.exports = Config;
