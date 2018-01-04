var cmd = {
	aliases: ["unban"],
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
			vk.users.get({
				user_id: ban_uid, // данные передаваемые API
				fields: 'name,lastname,sex'
			}).then(function (ban_user_info){
				ban_user_info = ban_user_info[0];
				cbot.mysql.db.query('DELETE FROM `ban` WHERE user_id = ? AND chat_id = ?', [ban_uid, msg.chat_id]);
				msg.reply("[id"+ban_uid+"|"+ban_user_info.first_name+" "+ban_user_info.last_name+"] разбанен"+(ban_user_info.sex==1?'а':'')+" в этом чате [id"+msg.user_id+"|Администратором].");
			});
		});
	},
	sign:{
		issuer: 1,
		version: 0.1,
		trust_key: '9f7ea242fbf422a4abd2f8ad30ef0653',
	},
}

module.exports = cmd;