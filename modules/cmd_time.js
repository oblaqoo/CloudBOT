module.exports = {
	msg:{
		'time':{
			aliases: ["time","t","время","тайм","vremya","дата","сегодня","date"],
			description: "Текущее время на сервере", //описание функции
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				d = new Date();
				monthA = 'января,февраля,марта,апреля,мая,июня,июля,августа,сентября,октября,ноября,декабря'.split(',');
				msg.reply("Московское время: "+d.getDate()+" "+monthA[d.getMonth()]+" "+d.getFullYear()+" года "+cbot.utils.addZero(d.getHours())+":"+cbot.utils.addZero(d.getMinutes())+":"+cbot.utils.addZero(d.getSeconds()));
			},
		},
	},
}