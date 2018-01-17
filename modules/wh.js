module.exports = {
	msg:{
		'who':{
			aliases: ["who","кто"],
			description: "кто {козел}?", //описание функции
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				msg.getChatUsers({fields:'sex'}).then(function(data){
					var usr = data[Math.floor(Math.random() * data.length)];
					msg.reply('Думаю, это [id'+usr.id+'|'+usr.first_name+' '+usr.last_name+']');
				});
			},
		},
		'bottle':{
			aliases: ["bottle","бутылочка"],
			description: "Старая добрая бутылочка", //описание функции
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				msg.getChatUsers({name_case:'acc',fields:'sex'}).then(function(data){
					var usr = data[Math.floor(Math.random() * data.length)];
					msg.reply('💖 Бутылочка показала на [id'+usr.id+'|'+usr.first_name+' '+usr.last_name+']. Тайм ту цьом! 💖');
				});
			},
		},
		'whom':{
			aliases: ["whom","кого"],
			description: "кого {сегодня не будет на работе}?", //описание функции
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				msg.getChatUsers({name_case:'acc',fields:'sex'}).then(function(data){
					var usr = data[Math.floor(Math.random() * data.length)];
					msg.reply('Думаю, '+(usr.sex==2?'его':'ее')+' 👉 [id'+usr.id+'|'+usr.first_name+' '+usr.last_name+']');
				});
			},
		},
		'when':{
			aliases: ["when","когда"],
			description: "когда {конец света}?", //описание функции
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				var rtime = cbot.utils.rand(0,5);
				var d = new Date((Math.floor(Date.now()/1000)+cbot.utils.rand(10000,9999999))*1000);
				var monthA = 'января,февраля,марта,апреля,мая,июня,июля,августа,сентября,октября,ноября,декабря'.split(',');
				var rs = (rtime==0?'Никогда':(rtime==1?'Завтра':(rtime==2?'Когда-нибудь...':(rtime==3?'Как только, так сразу':"Думаю, это произойдёт "+d.getDate()+" "+monthA[d.getMonth()]+" "+d.getFullYear()+" года в "+cbot.utils.addZero(d.getHours())+":"+cbot.utils.addZero(d.getMinutes())+":"+cbot.utils.addZero(d.getSeconds())))));
				msg.reply(rs);
			},
		},
	},
}