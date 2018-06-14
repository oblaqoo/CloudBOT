module.exports = {
	token: 'token', //access_token аккаунта бота; можно не заполнять, если бот запущен в сообществе
	vnum: '0.0.2',
	v: 'CloudBOT NODE v0.0.2 by oblaqoo | 14 jun 2018',
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
		"basic_htmlspecialcharsdecode",
		"antimat",
		"autofriends",
		"autostatus",
		"basic_admin",
		"cmd_time",
		"cmd_ball",
		"cmd_say",
		"cmd_info",
		"cmd_wh",
		"cmd_help",
		"pi",
		"web_panel",
		"invite_links",
	],
	voice_key: '', //получите API-ключ SpeechKit Cloud здесь: https://developer.tech.yandex.ru/keys/
	voice_speaker: 'zahar', //голос синтезированной речи. Можно выбрать один из следующих голосов: женские голоса: jane, oksana, alyss и omazh; мужские голоса: zahar и ermil.
	domain: 'oblaqoo.ru', //домен, ведущий на сервер с ботом
	callback:{ //конфиги для работы бота в сообществах; заполнять с помощью ВК: Ваше сообщество -> Управление сообществом -> Работа с API -> Callback API
		group: false, //бот запущен в сообществе? true - да / false - нет
		port: 80, //порт, нужен для проксирования, например, через nginx
		return_key: 'gjzx53S', //строка, которую должен вернуть сервер
		secret_key: 'secretkey', //секретный ключ
		domain: 'site.ru', //домен, ведущий на сервер с ботом
		token: 'token', //access_token сообщества бота; Создать: Ваше сообщество -> Управление сообществом -> Работа с API -> Ключи доступа -> Создзать ключ -> Выставьте все галочки -> Создать -> Подтвердите действие -> Готово
		//Адрес сервера будет показан при запуске бота
	},
	robokassa:{
		login: "cloudbot", //Идентификатор магазина
		password1: "password1", //пароль #1
		password2: "password2", //пароль #2
		test: true //Тестовый режим
	},
	dev_mode: false,
};