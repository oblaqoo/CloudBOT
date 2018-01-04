var cmd = {
	aliases: ["ban","бан","блокировка","банан"],
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
				msg.reply("К сожалению, Вы не можете заблокировать "+(ban_check == 1 ? 'модератора' : 'администратора')+"!");
				return;
			}
			chat_info = cbot.service.BSC[msg.chat_id];
			vk.users.get({
				user_id: ban_uid, // данные передаваемые API
				fields: 'name,lastname,sex'
			}).then(function (ban_user_info){
				ban_user_info = ban_user_info[0];
				cbot.mysql.db.query('INSERT INTO `ban` SET ?', {user_id: ban_uid, chat_id: msg.chat_id});
				msg.reply("[id"+ban_uid+"|"+ban_user_info.first_name+" "+ban_user_info.last_name+"] забанен"+(ban_user_info.sex==1?'а':'')+" в этом чате [id"+msg.user_id+"|Администратором].");
				msg.removeChatUser(ban_uid);
			});
		});
	},
	load:function(cbot,vk){
		cbot.mysql.db.query("CREATE TABLE IF NOT EXISTS `ban` ( `id` int(11) NOT NULL AUTO_INCREMENT, `user_id` int(11) NOT NULL, `chat_id` int(11) NOT NULL, PRIMARY KEY (`id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
	},
	sign:{
		issuer: 1,
		version: 0.1,
		trust_key: '67c16505afbeb7ad1990fd8e231c5e8c',
	},
}

module.exports = cmd;