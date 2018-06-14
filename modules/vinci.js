var fs = require('fs'),
	path = require('path'),
	mime = require('mime'),
	proxy = 'http://cors.pmmlabs.ru/',
	filters = [
		1, 27, 64, 36, 56, 52, 29, 44,
		37, 45, 59, 60, 57, 58, 38, 46, 3,
		48, 4201, 39, 34, 12, 7, 31, 28, 26,
		5, 24, 10, 21, 15, 2, 9, 4, 6, 8, 11,
		14, 16, 17, 19, 20, 21, 25, 4101, 32
	],
	request = require('request');
module.exports = {
	msg:{
		'vinci':{
			aliases: ["vinci","art","перерисуй","винчи","арт"],
			description: "Обработает присланную фотографию указанным фильтром", //описание функции
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				if(!(cbot.utils.array_find(filters, obody)+1)) return msg.reply("Выберите существующий фильтр из доступных, например: art 4", {attachment: 'photo-123799408_456239018,photo-123799408_456239017'});
				msg.get().then(function(data){
					if(!data.attachments || !data.attachments[0] || !data.attachments[0].photo) return msg.reply("Прикрепите желаемое мзображение для обработки!")
					let pic = cbot.utils.getMaxPhoto(data.attachments[0].photo)
					p = fs.createWriteStream(cbot.config.tmp+"/"+path.basename(pic))
					request(pic).pipe(p)
					msg.send("Изображение обрабатывается...");
					p.on('finish', function(){
						request({
							url: 'http://vinci.camera/preload',
							method: 'post',
							formData:{
								file:{
									value: fs.createReadStream(cbot.config.tmp+"/"+path.basename(pic)),
									options: {
										filename: path.basename(pic),
										contentType: mime.getType(cbot.config.tmp+"/"+path.basename(pic))
									}
								}
							},
							json: true
						}, (err, res, body) => {
							if(!err && res.statusCode === 200 && body.preload){
								var fname = cbot.config.tmp+"/vinci_"+path.basename(pic);
								var w = fs.createWriteStream(fname)
								request(`${proxy}http://vinci.camera/process/${body.preload}/${obody}`).pipe(w)
								w.on('finish', function(){
									msg.sendPhoto(fs.createReadStream(fname), "Не забудь рассказать обо мне своим друзьям!\n\n#CloudBOT #art #free")
								})
								w.on('error', function(err){
									console.log('[VINCI] ERR! ', err)
									msg.reply("К сожалению, при обработке фотографии произошла ошибка. Пожалуйста, повторите попытку позже!")
								})
							}
						})
					})
				})
			},
		},
	}
}