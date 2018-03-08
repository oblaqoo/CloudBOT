module.exports = {
	msg:{
		'getinvite':{
			aliases: ["invite"],
			description: "Вернет приглашение в беседу\n\ninvite - текущее приглашение\ninvite reset - сбросить текущее приглашение и вернуть новое", //описание функции
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				msg.get().then(function(d){
					if(d.admin_id != cbot.config.bot_id) return msg.reply("К сожалению, я не являюсь администратором беседы и не могу взаимодействовать с приглашениями!")
					msg.getInviteLink(obody === "reset" ? 1 : 0).then(function(data){
						if(obody === "reset") return msg.reply("Приглашение сброшено! Новое приглашение: "+data.link)
						msg.reply("Текущее приглашение в этот чат: "+data.link)
					})
				})
			},
		},
	}
}