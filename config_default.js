module.exports = {
	token: 'token', //access_token аккаунта бота
	v: 'CloudBOT v2.4 NODE by oblaqoo | 04 jan 2018',
	bot_id: 348877376, //id аккаунта бота
	bd_host: 'localhost', //Адрес сервера mysql
	bd_user: 'cbot', //Пользователь mysql
	bd_password: 'password', //Пароль пользователя mysql
	bd_db: 'database', //База данных mysql
	modules_place: 'modules', //местоположение папки с модулями
	modules:[ //активные команды из папки cmds
		"autostatus",
		"antimat",
		"cmd_time",
		"cmd_warn",
		"cmd_ban",
		"cmd_kick",
		"cmd_unban",
		"cmd_unwarn",
		"cmd_ball",
		"cmd_admin",
		"cmd_moder",
	],
	dev_mode: false,
};