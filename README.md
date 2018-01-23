CloudBOT NODE 0.0.1
=
```
ВНИМАНИЕ! CloudBOT NODE был отделён от основной версионной ветки! Версия CloudBOT NODE сброшена до 0.0.1.

- Изменён шаблон модуля, старый более не поддерживается!
- Один модуль теперь может содержать несколько чат-команд
- Убраны консольные команды, т.к. от них одни проблемы :)
- Модули cmd_admin, cmd_moder, cmd_ban, cmd_unban, cmd_warn, cmd_unwarn и cmd_kick объеденены в один basic_admin
```

Если бот не выгоняет пользователя из чата после команд ban и warn перейдите по пути .../node_modules/VK-Promise/ и измените файл index.js в строке 188:
```
return this.chatMethod("messages.removeChatUser", {message_id: this.id});
```
замените на
```
return this.chatMethod("messages.removeChatUser", {user_id});
```

Возможности
-
* Администрирование чатов
    * администраторы 
    * модераторы
    * анти-мат
* Развлечения
    * Шар судьбы
* Модули
    > Возможность создать свой уникальный функционал бота и делиться им с сообществом
* Безопасность
    > Загружаемые модули запускаются по умолчанию в песочнице если они не прошли модерацию или не активен режим разработчика
* Long Polling 
    > Бот получает сообщения мгновенно с помощью технологии Long Polling
* Анти-Капча
    > Обработка капчи с помощью сервиса RuCaptcha
* Удобная конфигурация
	> Вам не требуется копаться в коде для настройки бота. Просто создайте файл `config.js` с содержимым `config_default.js`.
* Режим разработчика
	> Позволяет отключить режим песочницы для всех подгружаемых модулей без модерации

TODO
-
- [X] Автодобавление в друзья
- [X] Анти-Капча
- [X] Псевдоинтеллект
- [X] Web-Панель
- [ ] Управление чатами через web-панель

Установка
-
```
cd /home/ && git clone https://github.com/oblaqoo/CloudBOT && cd CloudBOT && npm install
```
Обновление
-
```
cd /home/CloudBOT && git pull && npm install
```
Получение токена
-
1. Перейдите по ссылке
```
https://oauth.vk.com/oauth/authorize?client_id=5285371&display=page&redirect_uri=https://oauth.vk.com/blank.html&scope=messages%2Cfriends%2Cphotos%2Cstatus%2Coffline%2Caudio&response_type=token&v=5.45
```
2. Разрешите доступ к аккаунту
3. Скопируйте из адресной строки полученный токен
```
https://oauth.vk.com/blank.html#access_token=Здесь_находится_ваш_токен&expires_in=0&user_id=145301982
```
Запуск
-
```
npm start
```
или 
```
node bot.js
```

Документация
-
* `cbot` - объект бота
	* `service`
		* `counters` - счетчики
			* `messages` - счетчики сообщений с начала сессии
              * all - все `int`
              * chat - в чатах `int`
              * `prv` - личных
            * start - время запуска, timestamp `int`
		* `is_admin` (chat_id, user_id) - проверка, админ чата?
		* `is_moder` (chat_id, user_id) - проверка, модератор чата?
		* `lvl_check` (chat_id, user_id) - проверка, уровень админки; `0` - работяга, `1` - модер, `2` - админ
	* `modules`
		* `load` (module) - загрузка модуля
	* `mysql`
		* `db` - mysql connection, [docs](https://www.npmjs.com/package/mysql)
	* `trust`
		* `check` (module) - проверка модуля
	* `utils`
		* `rand` (min_random, max_random) - рандомное число
		* `array_find` (array, value) - поиск значений в массиве
		* `addZero` (num) - добавляет `0` к одноразрядным числам. ( 4 => 04 ) 
		* `chtime` (sec) - секунды в человекопонятное время ( 5025 => 01:23:45 )

* `msg` - объект сообщения
	* `send` - отправить сообщение
		* `edit` - отредактировать отправленное сообщение
		* `pin` - закрепить
	* `send` - отправить сообщение
	* `reply` - ответить на сообщение
	* `sendSticker` - отправить стикер
	* `sendPhoto` - отправить фото
	* `sendDoc` - отправить документ
	* `sendGraffiti` - отправить граффити
	* `sendAudioMessage` - отправить голосовое сообщение
	* `get` - получить данные, которые не выдает longpoll
	* `setActivity` - послать статус тайпинга
	* `deleteDialog` - удалить диалог
	* `delete` - удалить сообщение
	* `restore` - восстановить сообщение или пометить как спам
	* `markAsRead` - прочитать сообщение
	* `markAsImportant` - отметить важным
	* `markAsAnsweredDialog` - отметить отвеченным
	* `editChat` - изменяет название беседы
	* `getChatUsers` - получить участников беседы
	* `getChat` - получить информацию о беседе
	* `addChatUser` - добавить в беседе
	* `removeChatUser` - удалить и беседе
	* `edit` - отредактировать сообщение
	* `pin` - закрепить сообщение
	* `sendAttachment` - отправить сообщение с вложением
	* `getInviteLink` - получить ссылку на беседу

Стандартная структура модуля
-
```
 module.exports = {
	msg:{ //Чат-Команды || Этот блок не является обязательным, уберите его если он не используется вашим модулем
		'cmd':{ //здесь любое уникальное название команды, позволяющее команду идентифицировать
			aliases: ["команда","command","cmd","кмд","цмд"], //Синонимы команды, ТОЛЬКО МАЛЕНЬКИЕ БУКВЫ!
			description: "отправит `ответ`", //описание функции
			go:function(cbot,vk,msg,body,alias,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; alias = вызванный alias команды; cbody = тело сообщения без alias
				//тут функционал чат-команды
				msg.reply('ответ'); //так же доступны любые функции классов msg и cbot
			},
		},
		'twocmd':{ //здесь любое уникальное название команды, позволяющее команду идентифицировать
			aliases: ["2команда","2command","twocmd","2кмд","2цмд"], //Синонимы команды, ТОЛЬКО МАЛЕНЬКИЕ БУКВЫ и цифры!
			description: "отправит `ответ 2`", //описание функции
			go:function(cbot,vk,msg,body,alias,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; alias = вызванный alias команды; cbody = тело сообщения без alias
				//тут функционал чат-команды
				msg.reply('ответ 2'); //так же доступны любые функции классов msg и cbot
			},
		},
	},
	load: function(cbot, vk, cb){ //Этот блок не является обязательным, уберите его если он не используется вашим модулем
		//тут функционал модуля, вызов при запуске модуля
		//доступны vk и cbot
		cb.on("message",function(msg){ //message event
			msg.send(msg.body); //Ответит тем же сообщением, что получит
		});
	},
	sign:{ //этот блок нужен для проверки подлинности. Если ваш скрипт может работать в песочнице, уберите этот блок
		//Этот блок не является обязательным, уберите его если он не используется вашим модулем
		issuer: 1, //разработчик, qooid
		version: 0.1.1, //версия модуля
		trust_key: 'trust_key', //секретный ключ
		//Для получения этих данных и регистрации себя в качестве разработчика обратитесь сюда: https://vk.me/oblaqoo
	},
}
```
