var request = require('request');
var cbot;
var mdl = {
	cities:{},
	game:function(word, msg){
		if(!msg.body){
			return cbot.callbacks.getall(msg).then(function(nmsg){
				mdl.game(nmsg.body, nmsg)
			})
		}
		var wd = word.toLowerCase()
		if(wd == "стоп игра" || wd == "конец игры" || wd == "закончить игру") return msg.send("Игра окончена! С тобой приятно было играть. ;)")
		if(!(cbot.utils.array_find(mdl.cities['all'], wd)+1)){
			msg.send("К сожалению, я не знаю такого города. Попробуй назвать другой!)")
			return cbot.callbacks.getall(msg).then(function(nmsg){
				mdl.game(nmsg.body, nmsg)
			})
		}
		var last = wd.slice(-1);
		msg.send(this.cities[last][Math.floor(Math.random() * this.cities[last].length)])
		return cbot.callbacks.getall(msg).then(function(nmsg){
			mdl.game(nmsg.body, nmsg)
		})
	},
	msg:{
		'cities':{
			aliases: ["города","cities"],
			description: "Традиционная игра в города", //описание функции
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				msg.send("Ок, играем в \"Города\"!\n\nПравила простые: нужно назвать город на последнюю букву предыдущего названого города.\n\nНачинай ты! Называй город.\n\nЧтобы закончить игру, набери \"стоп игра\" или \"конец игры\" или \"закончить игру\".")
				return cbot.callbacks.getall(msg).then(function(nmsg){
					mdl.game(nmsg.body, nmsg)
				})
			},
		}
	},
	load:function(cbt){
		cbot = cbt
		request('https://api.oblaqoo.ru/bot.cities', function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var info = JSON.parse(body);
				mdl.cities['all'] = []
				for(var i = 0; i < info.length; i++){
					if(!mdl.cities[info[i].name[0].toLowerCase()]) mdl.cities[info[i].name[0].toLowerCase()] = []
					mdl.cities['all'].push(info[i].name.toLowerCase())
					mdl.cities[info[i].name[0].toLowerCase()].push(info[i].name.toLowerCase())
				}
			}
		})
	},
}

module.exports = mdl;