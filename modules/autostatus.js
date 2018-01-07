var os = require('os');
var mdl = {
	counters:{
		msg: 0,
		chats: 0,
		prv: 0,
	},
	load: function(cbot, vk){
		cbot.mysql.db.query('CREATE TABLE IF NOT EXISTS `cbot_autostatus` (`id` INT(11) NOT NULL AUTO_INCREMENT,`cpu` SMALLINT(3) NOT NULL,`msgs` INT(11) NOT NULL,`msgs_chat` INT(11) NOT NULL,`msgs_prv` INT(11) NOT NULL,`time` INT(11) NOT NULL,PRIMARY KEY(`id`))');
		var d = new Date();
		var loads = os.loadavg();
		var percent = Math.round((loads[0]<1?loads[0]*100:99));
		cbot.mysql.db.query('SELECT * FROM `cbot_autostatus` ORDER BY `id` DESC LIMIT 1', function(err,result){
			if(!result[0])
				console.log('[AUTOSTATUS] Failed to load counters!');
			else{
				mdl.counters.msg = result[0].msgs;
				mdl.counters.chats = result[0].msgs_chat;
				mdl.counters.prv = result[0].msgs_prv;
			}
			vk.status.set({
				text: "Uptime: "+cbot.utils.chtime(Math.round(+new Date()/1000)-cbot.service.counters.start)+"; Сообщений за сессию: "+cbot.service.counters.messages.all+"; Сообщений с начала года: "+mdl.counters.msg+"; Нагрузка процессора: "+percent+"%; Статус: "+(percent > 80?'Houstan, we have a problems! ❗❗❗':(percent > 40?'some problems ℹℹℹ':'ok ✅✅✅')),
			});
		});
		setInterval(function(){
			var d = new Date();
			var loads = os.loadavg();
			var percent = Math.round((loads[0]<1?loads[0]*100:99));
			ms_msg = mdl.counters.msg + cbot.service.counters.messages.all;
			ms_chat = mdl.counters.chats + cbot.service.counters.messages.chats;
			ms_prv = mdl.counters.prv + cbot.service.counters.messages.prv();
			cbot.mysql.db.query('INSERT INTO `cbot_autostatus` SET ?', {cpu: percent, msgs: ms_msg, msgs_chat: ms_chat, msgs_prv: ms_prv, time: Math.round(+new Date()/1000)},function(err,rs){if(err)console.log(err)});
			vk.status.set({
				text: "Uptime: "+cbot.utils.chtime(Math.round(+new Date()/1000)-cbot.service.counters.start)+"; Сообщений за сессию: "+cbot.service.counters.messages.all+"; Сообщений с начала года: "+ms_msg+"; Нагрузка процессора: "+percent+"%; Статус: "+(percent > 80?'Houstan, we have a problems! ❗❗❗':(percent > 40?'some problems ℹℹℹ':'ok ✅✅✅')),
			});
		}, 34000);
		console.log('Auto-Status by oblaqoo successfully loaded!');
	},
	sign:{
		issuer: 1,
		version: 0.2,
		trust_key: 'd70f5ea9a4efb4a838f18c4ef8bea232',
	},
}

module.exports = mdl;