var request = require('request');
var fs = require("fs");
module.exports = {
	msg:{
		/*'info':{
			aliases: ["info","инфа"],
			description: "отправит `ответ`", //описание функции
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				var ASC = cbot.service.ASC[msg.chat_id];
				var BSC = cbot.service.BSC[msg.chat_id];
				msg.get().then(function(data){
					var fname = cbot.config.tmp+"/"+Date.now()+"_"+msg.user_id+".jpg";
					var w = fs.createWriteStream(fname);
					request("https://api.oblaqoo.ru/bot.pctr?type=chat_info&data="+encodeURIComponent(JSON.stringify({
						type: (msg.chat_id?1:0),
						did: (msg.chat_id?msg.chat_id:msg.user_id),
						name: (msg.chat_id?msg.title:'Здесь должно быть Ваше имя)'),
						admin_id: (msg.chat_id?data.admin_id:0),
						mm: (data.admin_id==cbot.config.bot_id?(BSC?1:0):2),
						antimat: (BSC?BSC.antimat:0),
						max_warns: (BSC?BSC.max_warns:0),
						freemode: (ASC?ASC.freemode:0),
						open: (ASC?ASC.open:0),
						freevoice: (ASC?ASC.voice:0),
						chat_admin: (BSC?BSC.admin:0),
					}))).pipe(w);
					w.on('finish', function(){
						console.log('file downloaded ', fname);
						msg.sendPhoto(fs.createReadStream(fname));
					});
				});
			},
		},*/
		'info':{
			aliases: ["info","инфа","инфо"],
			description: "Информация о текущей беседе", //описание функции
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
		trust_key: '068bb88d797e07616e9f392dfe436007',
	},
}