module.exports = {
	msg:{
		'help':{
			aliases: ["help","h","хелп","помощь","помоги","команды","cmds","date"],
			description: "Список всех команд", //описание функции
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				var cmd = "В данный момент [sibteambot|бот] понимает эти команды:\n\n";
				for(var key in cbot.modules.aliases){
					cmd = cmd+key+"\n";
				}
				msg.send(cmd+"\nУзнать о команде подробнее: helpsa {команда}\n\nНекоторые из этих команд доступны только в чатах с ботом-модератором. Создать такой чат можно здесь: bot.oblaqoo.ru\n\nВы всегда можете написать [oblaqoo|разработчику] и предложить что-нибудь новенькое! 👍👍👍");
			},
		},
		'helpsa':{
			aliases: ["helpsa"],
			description: "Подробное описание команды", //описание функции
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				let module = cbot.modules.loaded[cbot.modules.aliases[obody]],
					dsc = module.msg[module.aliases[obody]].description;
				if(!dsc) return msg.reply('К сожалению, разработчик модуля `'+cbot.modules.aliases[obody]+'` не добавил описание этой команды');
				msg.reply(obody+": "+dsc);
			},
		},
	},
	sign:{
		issuer: 1,
		version: 0.1,
		trust_key: '5f22626b406e1af0a2e2c4b1d5ef11fb',
	},
}