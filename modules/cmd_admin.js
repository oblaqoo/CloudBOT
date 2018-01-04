var cmd = {
	aliases: ["admin","makeadmin","makeadminsgreateagain!"],
	msg:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
		if(!cbot.service.BSC[msg.chat_id]){
			msg.reply("Данная команда доступна только для бесед с ботом-модератором.\n\nСоздать беседу с ботом-модератором Вы можете здесь: https://bot.oblaqoo.ru/");
		}
		var acheck = cbot.service.lvl_check(msg.chat_id,msg.user_id);
		if(acheck <= 1){
			msg.reply('К сожалению, Вы не администратор этого чата!');
			return;
		}
		msg.get().then(function(ddata){
			var ban_uid = (ddata.fwd_messages?ddata.fwd_messages[0].user_id:null);
			if((!ban_uid) || (ban_uid == msg.user_id)){
				msg.reply("Прикрепите сообщение будущего администратора!");
				return;
			}
			cbot.mysql.db.query('SELECT * FROM `chat_privilege` WHERE chat_id = ? AND user_id = ?', [msg.chat_id,ban_uid], function(err,result){
				if(!result[0]){
					cbot.mysql.db.query('INSERT INTO `chat_privilege` SET ?', {user_id: ban_uid, chat_id: msg.chat_id, lvl: 2});
					var bd_warn_count = 1;
				} else if(result[0].lvl==2){
					msg.reply("К сожалению, этот человек уже обладает статусом администратора");
				} else{
					var bd_warn_count = result[0].count + 1;
					cbot.mysql.db.query('UPDATE `chat_privilege` SET `lvl` = ? WHERE `user_id` = ? AND `chat_id` = ?', [2, ban_uid, msg.chat_id]);
				}
				vk.users.get({
					user_id: ban_uid, // данные передаваемые API
					fields: 'name,lastname,sex'
				}).then(function (ban_user_info){
					ban_user_info = ban_user_info[0];
					msg.reply("[id"+ban_uid+"|"+ban_user_info.first_name+" "+ban_user_info.last_name+"] получил"+(ban_user_info.sex==1?'а':'')+" статус администратора в этом чате!");
				});
			});
		});
	},
	sign:{
		issuer: 1,
		version: 0.1,
		trust_key: '4549ff3b50946881108bc8d087e046d6',
	},
}

module.exports = cmd;