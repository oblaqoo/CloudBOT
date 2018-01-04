var cmd = {
	aliases: ["kick","кик","выкинуть"],
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
			vk.users.get({
				user_id: ban_uid, // данные передаваемые API
				fields: 'name,lastname,sex'
			}).then(function (ban_user_info){
				ban_user_info = ban_user_info[0];
				msg.reply("[id"+ban_uid+"|"+ban_user_info.first_name+" "+ban_user_info.last_name+"] изгнан"+(ban_user_info.sex==1?'а':'')+" из этого чата [id"+msg.user_id+"|Администратором] по причине: "+obody);
				msg.removeChatUser(ban_uid);
			});
		});
	},
	sign:{
		issuer: 1,
		version: 0.1,
		trust_key: '5ac736df1f06e2f0f93adb8c88a66a82',
	},
}

module.exports = cmd;