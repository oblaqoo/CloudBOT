var fs = require('fs'),
	gm = require('gm').subClass({imageMagick: true});
module.exports = {
	msg:{
		'info':{
			aliases: ["info","инфа"],
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				var ASC = cbot.service.ASC[msg.chat_id];
				var BSC = cbot.service.BSC[msg.chat_id];
				if(!msg.chat_id) return msg.reply("Вы должны быть в беседе!");
				msg.get().then(function(data){
					msg.send("Chat info:\n\nID: "+msg.chat_id+"\nAdmin: @id"+data.admin_id+"\nMM: "+(data.admin_id == cbot.config.bot_id ? 'allow' : 'deny')+"\nMM status: "+(BSC ? "true\nAnti-mat: "+(BSC.antimat == 1 ? 'true' : 'false')+"\nMax warns: "+BSC.max_warns+"\nChat Admin: @id"+BSC.admin : 'false')+"\n\nFreeMode(свободный режим): "+(ASC.freemode===1?'true':'false')+"\nFreeVoice(ответ на голосовые): "+(ASC.voice===1?'true':'false')+"\nOpenMode(Любой желающий может присоединиться к чату через https://vk.cc/7AjkXP): "+(ASC.open===1?'true':'false')+"\n\nПравила чата: отравьте rules");
				});
			},
		},
	},
	sign:{
		issuer: 1,
		version: 0.1,
		trust_key: 'key',
	},
}