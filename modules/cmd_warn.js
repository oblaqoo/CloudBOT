var cmd = {
	aliases: ["warn","варн","предупреждение","вареник","мразь"],
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
			ban_check = cbot.service.lvl_check(msg.chat_id,ban_uid);
			if((ban_check != 0) && (acheck != 2)){
				msg.reply("К сожалению, Вы не можете выдать предупреждение "+(ban_check == 1 ? 'модератору' : 'администратору')+"!");
				return;
			}
			chat_info = cbot.service.BSC[msg.chat_id];
			cbot.mysql.db.query('SELECT * FROM `warns` WHERE chat_id = ? AND user_id = ?', [msg.chat_id,ban_uid], function(err,result){
				if(!result[0]){
					var dd = {user_id: ban_uid, chat_id: msg.chat_id, count: 1};
					cbot.mysql.db.query('INSERT INTO `warns` SET ?', dd);
					var bd_warn_count = 1;
				} else{
					var bd_warn_count = result[0].count + 1;
					cbot.mysql.db.query('UPDATE `warns` SET `count` = ? WHERE `user_id` = ? AND `chat_id` = ?', [bd_warn_count, ban_uid, msg.chat_id]);
				}
				vk.users.get({
					user_id: ban_uid, // данные передаваемые API
					fields: 'name,lastname,sex'
				}).then(function (ban_user_info){
					ban_user_info = ban_user_info[0];
					if(bd_warn_count > chat_info.max_warns){
						cbot.mysql.db.query('INSERT INTO `ban` SET ?', {user_id: ban_uid, chat_id: msg.chat_id});
						msg.reply("[id"+ban_uid+"|"+ban_user_info.first_name+" "+ban_user_info.last_name+"] забанен"+(ban_user_info.sex==1?'а':'')+" в этом чате [id"+msg.user_id+"|Администратором].");
						msg.removeChatUser(ban_uid);
					} else{
						msg.reply("[id"+ban_uid+"|"+ban_user_info.first_name+" "+ban_user_info.last_name+"] получил"+(ban_user_info.sex==1?'а':'')+" предупреждение от [id"+msg.user_id+"|Администратора].\n\nВ данный момент он"+(ban_user_info.sex==1?'а':'')+" имеет "+bd_warn_count+"/"+chat_info.max_warns+" предупреждений.");
					}
				});
			});
		});
	},
	load:function(cbot,vk){
		cbot.mysql.db.query("CREATE TABLE IF NOT EXISTS `warns` ( `id` int(11) NOT NULL AUTO_INCREMENT, `user_id` int(11) NOT NULL, `count` int(11) NOT NULL, `chat_id` int(11) NOT NULL, PRIMARY KEY (`id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
	},
	sign:{
		issuer: 1,
		version: 0.1,
		trust_key: '409a6acc512c3ba7403d3d20282c85dd',
	},
}

module.exports = cmd;