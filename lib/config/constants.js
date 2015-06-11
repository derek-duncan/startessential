"use strict";

module.exports = function() {

	var env = process.env.NODE_ENV || 'development';
	var port = 3000;
	var dbContants = databaseConfig();
	var appConstants = applicationConfig();

	var obj = {
		application : {
			url: appConstants[env]['url'],
			host: appConstants[env]['host'],
			port: appConstants[env]['port'],
		},
		database : {
			database: dbContants[env]['database']
		},
		server : {
			defaultHost: 'http://localhost:3000'
		}
	};

	return obj;

	function databaseConfig(){
		return {
			'production' : {
				'host' : process.env.DB_PRD_HOST || 'localhost',
				'user' : process.env.DB_PRD_USER || 'root',
				'password' : process.env.DB_PRD_PASS || '',
				'database' : 'se'
			},
			'development' : {
				'database' : 'mongodb://localhost/se-dev'
			}
		};
	}

	function applicationConfig(){
		return {
			'production' : {
				'url' : 'https://' + process.env.NODE_HOST + ':' + port,
				'host' : process.env.NODE_HOST || 'localhost',
				'port' : process.env.NODE_PORT || port
			},
			'development' : {
				'url' : 'http://' + process.env.NODE_HOST + ':' + port,
				'host' : process.env.NODE_HOST || 'localhost',
				'port' : process.env.NODE_PORT || port
			}
		};
	}
}();
