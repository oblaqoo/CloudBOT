module.exports = {
	token: 'token', //access_token аккаунта бота
	v: 'CloudBOT NODE v0.0.1 by oblaqoo | 07 jan 2018',
	vnum: '0.0.1',
	bot_id: 348877376, //id аккаунта бота
	bd_host: 'localhost', //Адрес сервера mysql
	bd_user: 'cbot', //Пользователь mysql
	bd_password: 'password', //Пароль пользователя mysql
	bd_db: 'database', //База данных mysql
	web_port: 8080,
	tmp: './tmp', //временная папка
	captcha:{
		apiKey: 'key', //API KEY ruCaptcha, брать здесь: https://rucaptcha.com/enterpage
		dir: './tmp', //директория для загрузки капчи
		delay: 1000, //интервал проверки капчи
	},
	modules_place: 'modules', //местоположение папки с модулями
	modules:[ //активные команды из папки cmds
		"antimat",
		"autofriends",
		"autostatus",
		"basic_admin",
		"cmd_time",
		"cmd_ball",
		"cmd_say",
	],
	voice_key: '', //получите API-ключ SpeechKit Cloud здесь: https://developer.tech.yandex.ru/keys/
	voice_speaker: 'zahar', //голос синтезированной речи. Можно выбрать один из следующих голосов: женские голоса: jane, oksana, alyss и omazh; мужские голоса: zahar и ermil.
	dev_mode: false,
};