var mdl = {
	aliases: ["antimat","антимат"],
	msg:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
		if(!cbot.service.BSC[msg.chat_id]){
			msg.reply("Данная команда доступна только для бесед с ботом-модератором.\n\nСоздать беседу с ботом-модератором Вы можете здесь: https://bot.oblaqoo.ru/");
		}
		var acheck = cbot.service.lvl_check(msg.chat_id,msg.user_id);
		if(acheck < 1){
			msg.reply('К сожалению, Вы не администратор этого чата!');
			return;
		}
		var chat_settings = cbot.service.BSC[msg.chat_id];
			if(chat_settings.antimat==1){
				var cha = 0;
				msg.reply("Анти-мат для этого чата ОТКЛЮЧЕН. Теперь предупреждения за нецензурную брань выдаваться не будут");
			} else{
				var cha = 1;
				msg.reply("Анти-мат для этого чата ВКЛЮЧЕН. Теперь за нецензурную брань будут выдаваться предупреждения!");
			}
			cbot.mysql.db.query('UPDATE `chat_settings` SET `antimat` = ? WHERE `chat_id` = ?', [cha, msg.chat_id]);
			cbot.service.BSC[msg.chat_id].antimat = cha;
	},
	load:function(cbot,vk,cb){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения
		cb.on("message",function(msg){
			if((msg.out == false) && (msg.chat_id)){
				if(BSC = cbot.service.BSC[msg.chat_id]){
					if((BSC.antimat) && (msg.body.match(/(^хуй|пизд|^бля|трах|ебать|ебал|хуила|балять|уебище|уёбище|пидор|pidor|пидр|fuck|blyat|shit|^huy|hooila|pizda)/iu))){
						chat_info = BSC;
						cbot.mysql.db.query('SELECT * FROM `warns` WHERE chat_id = ? AND user_id = ?', [msg.chat_id,msg.user_id], function(err,result){
							if(!result[0]){
								cbot.mysql.db.query('INSERT INTO `warns` SET ?', {user_id: msg.user_id, chat_id: msg.chat_id, count: 1});
								var bd_warn_count = 1;
							} else{
								var bd_warn_count = result[0].count + 1;
								cbot.mysql.db.query('UPDATE `warns` SET `count` = ? WHERE `user_id` = ? AND `chat_id` = ?', [bd_warn_count, msg.user_id, msg.chat_id]);
							}
							vk.users.get({
								user_id: msg.user_id, // данные передаваемые API
								fields: 'name,lastname,sex'
							}).then(function (ban_user_info){
								ban_user_info = ban_user_info[0];
								if(bd_warn_count > chat_info.max_warns){
									cbot.mysql.db.query('INSERT INTO `ban` SET ?', {user_id: msg.user_id, chat_id: msg.chat_id});
									msg.reply("[id"+msg.user_id+"|"+ban_user_info.first_name+" "+ban_user_info.last_name+"] забанен"+(ban_user_info.sex==1?'а':'')+" в этом чате за чрезмерное использование запрещённой лексики.");
									msg.removeChatUser(msg.user_id);
								} else{
									msg.reply("[id"+msg.user_id+"|"+ban_user_info.first_name+" "+ban_user_info.last_name+"] получил"+(ban_user_info.sex==1?'а':'')+" предупреждение за использование запрещённой лексики.\n\nВ данный момент он"+(ban_user_info.sex==1?'а':'')+" имеет "+bd_warn_count+"/"+chat_info.max_warns+" предупреждений.");
								}
							});
						});
					}
				}
			}
		},function(err){throw(err);});
		console.log('Anti-Mat by oblaqoo successfully loaded!');
	},
	sign:{
		issuer: 1,
		version: 0.1,
		trust_key: '978a5a360378940254538322a868de56',
	},
}

module.exports = mdl;