var request = require('request');
var fs = require("fs");
module.exports = {
	msg:{
		'say':{
			aliases: ["voice","speak","say","голос","скажи","озвучь"],
			description: "Озвучит Ваше сообщение голосом", //описание функции
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				if(!cbot.config.voice_key) return msg.reply('Модуль cmd_say не настроен! Заполните поле voice_key в конфигурационном файле бота! (config.js)');
				if(obody.length > 1000) return msg.reply('В сообщении должно быть не более 1000 символов!');
				var fname = cbot.config.tmp+"/"+Date.now()+"_"+msg.user_id+".mp3";
				var w = fs.createWriteStream(fname);
				request("https://tts.voicetech.yandex.net/generate?text="+encodeURIComponent(obody)+"&format=mp3&lang=ru-RU&speaker="+cbot.config.voice_speaker+"&key="+cbot.config.voice_key+"&speed=1").pipe(w);
				w.on('finish', function(){
					console.log('file downloaded  ', fname);
					msg.sendAudioMessage(fs.createReadStream(fname));
				});
			},
		},
	}
}