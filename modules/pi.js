var request = require('request');
module.exports = {
	msg:{
		'freemode':{
			aliases: ["freemode","свободныйрежим"],
			description: "Включение/отключение `Свободного режима`\n\nВ свободном режиме бот отвечает на каждое сообщение, иначе - на сообщения с обращением или командой", //описание функции
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				if((msg.user_id !== data.admin_id) && (cbot.service.lvl_check(msg.chat_id,msg.user_id) < 1)){
					msg.reply('К сожалению, Вы не администратор/модератор этого чата!');
					return;
				}
				var chat_settings = cbot.service.ASC[msg.chat_id];
				if(chat_settings.freemode==1){
					var cha = 0;
					msg.reply("FreeMode для этого чата ОТКЛЮЧЕН. Теперь бот отвечает в чате только при наличии обращения в начале сообщения!");
				} else{
					var cha = 1;
					msg.reply("FreeMode для этого чата ВКЛЮЧЕН. Теперь бот отвечает на все сообщения в чате!");
				}
				cbot.mysql.db.query('UPDATE `all_chats_settings` SET `freemode` = ? WHERE `chat_id` = ?', [cha, msg.chat_id]);
				cbot.service.ASC[msg.chat_id].freemode = cha;
			},
		},
	},
	load:function(cbot,vk,cb){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения
		cb.on("mwa",function(msg){
			if(msg.out == false && !cbot.service.ignore[msg.id]){
				if((!msg.chat_id) || (((ASC = cbot.service.ASC[msg.chat_id]) && (ASC.freemode == 1)) || (msg.body.search(/(бот|bot|cloudbot|клауд|\$|#)/iu)+1))){
					vk.users.get({
						user_id: msg.user_id, // данные передаваемые API
						fields: 'name,lastname,sex'
					}).then(function (user_info){
						request('https://api.oblaqoo.ru/bot.pi?request='+encodeURIComponent(msg.body.replace(/(бот|bot|cloudbot|клауд|\$|#)( |)/iu, ''))+'&user='+JSON.stringify({first_name: user_info.first_name, last_name: user_info.last_name}), function (error, response, body) {
							if (!error && response.statusCode == 200) {
								var info = JSON.parse(body);
								if(info.response && !cbot.service.ignore[msg.id])
									if(msg.chat_id)
										msg.reply(info.response+(info.similarity<64?"\n\nОтвет может быть не точным! Степень понимания Вашего сообщения: "+Math.round(info.similarity)+"%":''));
									else
										msg.send(info.response+(info.similarity<64?"\n\nОтвет может быть не точным! Степень понимания Вашего сообщения: "+Math.round(info.similarity)+"%":''));
							}
						});
					});
				}
			}
		});
		console.log('CloudPI by oblaqoo successfully loaded!');
	},
	sign:{
		issuer: 1,
		version: 0.1,
		trust_key: 'ccdecfae956d16ced34d3adb8bdc056c',
	},
}