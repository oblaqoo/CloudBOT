var cmd = {
	aliases: ["unwarn","унварн"],
	msg:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
		if(!cbot.service.BSC[msg.chat_id]){
			msg.reply("Данная команда доступна только для бесед с ботом-модератором.\n\nСоздать беседу с ботом-модератором Вы можете здесь: https://bot.oblaqoo.ru/");
		}
		var acheck = cbot.service.lvl_check(msg.chat_id,msg.user_id);
		if(acheck < 1){
			msg.reply('К сожалению, Вы не администратор этого чата!');
			return;
		}
		msg.get().then(function(ddata){
			var ban_uid = (ddata.fwd_messages?ddata.fwd_messages[0].user_id:null);
			if((!ban_uid) || (ban_uid == msg.user_id)){
				msg.reply("Прикрепите сообщение нарушителя!");
				return;
			}
			chat_info = cbot.service.BSC[msg.chat_id];
			cbot.mysql.db.query('SELECT * FROM `warns` WHERE chat_id = ? AND user_id = ?', [msg.chat_id,ban_uid], function(err,result){
				if(!result[0]){
					msg.reply("У этого пользователя не имеется предупреждений!");
				} else{
					var bd_warn_count = result[0].count - 1;
					if(result[0].count==1){
						cbot.mysql.db.query('DELETE FROM `warns` WHERE user_id = ? AND chat_id = ?', [ban_uid, msg.chat_id]);
						msg.reply("Вы сняли последнее предупреждение для этого пользователя!");
					} else cbot.mysql.db.query('UPDATE `warns` SET `count` = ? WHERE `user_id` = ? AND `chat_id` = ?', [bd_warn_count, ban_uid, msg.chat_id]);
				}
				if(bd_warn_count){
					vk.users.get({
						user_id: ban_uid, // данные передаваемые API
						fields: 'name,lastname,sex',
						name_case: 'gen',
					}).then(function (ban_user_info){
						ban_user_info = ban_user_info[0];
						msg.reply("С [id"+ban_uid+"|"+ban_user_info.first_name+" "+ban_user_info.last_name+"] снято предупреждение [id"+msg.user_id+"|Администратором].\n\nВ данный момент он"+(ban_user_info.sex==1?'а':'')+" имеет "+bd_warn_count+"/"+chat_info.max_warns+" предупреждений.");
					});
				}
			});
		});
	},
	sign:{
		issuer: 1,
		version: 0.1,
		trust_key: 'ec6dc8bbc4c7794853f47233f87e02b5',
	},
}

module.exports = cmd;