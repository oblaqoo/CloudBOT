module.exports = {
	token: 'token', //access_token аккаунта бота
	v: 'CloudBOT NODE v0.0.1 by oblaqoo | 07 jan 2018',
	bot_id: 348877376, //id аккаунта бота
	bd_host: 'localhost', //Адрес сервера mysql
	bd_user: 'cbot', //Пользователь mysql
	bd_password: 'password', //Пароль пользователя mysql
	bd_db: 'database', //База данных mysql
	modules_place: 'modules', //местоположение папки с модулями
	modules:[ //активные команды из папки cmds
		"antimat",
		"autofriends",
		"autostatus",
		"basic_admin",
		"cmd_time",
		"cmd_ball",
	],
	dev_mode: false,
};