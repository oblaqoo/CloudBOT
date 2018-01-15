module.exports = {
	msg:{
		'ban':{
			aliases: ["ban","бан","блокировка","банан"],
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				if(!cbot.service.BSC[msg.chat_id]){
					msg.reply("Данная команда доступна только для бесед с ботом-модератором.\n\nСоздать беседу с ботом-модератором Вы можете здесь: https://bot.oblaqoo.ru/");
					return;
				}
				var acheck = cbot.service.lvl_check(msg.chat_id,msg.user_id);
				if(acheck < 1){
					msg.reply('К сожалению, Вы не администратор/модератор этого чата!');
					return;
				}
				msg.get().then(function(ddata){
					var ban_uid = (ddata.fwd_messages?ddata.fwd_messages[0].user_id:null);
					if((!ban_uid) || (ban_uid == msg.user_id)){
						msg.reply("Прикрепите сообщение нарушителя!");
						return;
					}
					ban_check = cbot.service.lvl_check(msg.chat_id,ban_uid);
					if((ban_check != 0) && (acheck != 2)){
						msg.reply("К сожалению, Вы не можете заблокировать "+(ban_check == 1 ? 'модератора' : 'администратора')+"!");
						return;
					}
					chat_info = cbot.service.BSC[msg.chat_id];
					vk.users.get({
						user_id: ban_uid, // данные передаваемые API
						fields: 'name,lastname,sex'
					}).then(function (ban_user_info){
						ban_user_info = ban_user_info[0];
						cbot.mysql.db.query('INSERT INTO `ban` SET ?', {user_id: ban_uid, chat_id: msg.chat_id});
						msg.send("[id"+ban_uid+"|"+ban_user_info.first_name+" "+ban_user_info.last_name+"] забанен"+(ban_user_info.sex==1?'а':'')+" в этом чате [id"+msg.user_id+"|Администратором].");
						msg.removeChatUser(ban_uid);
					});
				});
			},
		},
		'unban':{
			aliases: ["unban"],
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				if(!cbot.service.BSC[msg.chat_id]){
					msg.reply("Данная команда доступна только для бесед с ботом-модератором.\n\nСоздать беседу с ботом-модератором Вы можете здесь: https://bot.oblaqoo.ru/");
					return;
				}
				var acheck = cbot.service.lvl_check(msg.chat_id,msg.user_id);
				if(acheck < 1){
					msg.reply('К сожалению, Вы не администратор/модератор этого чата!');
					return;
				}
				msg.get().then(function(ddata){
					var ban_uid = (ddata.fwd_messages?ddata.fwd_messages[0].user_id:null);
					if((!ban_uid) || (ban_uid == msg.user_id)){
						msg.reply("Прикрепите сообщение нарушителя!");
						return;
					}
					chat_info = cbot.service.BSC[msg.chat_id];
					vk.users.get({
						user_id: ban_uid, // данные передаваемые API
						fields: 'name,lastname,sex'
					}).then(function (ban_user_info){
						ban_user_info = ban_user_info[0];
						cbot.mysql.db.query('DELETE FROM `ban` WHERE user_id = ? AND chat_id = ?', [ban_uid, msg.chat_id]);
						cbot.mysql.db.query('DELETE FROM `warns` WHERE user_id = ? AND chat_id = ?', [ban_uid, msg.chat_id]);
						msg.send("[id"+ban_uid+"|"+ban_user_info.first_name+" "+ban_user_info.last_name+"] разбанен"+(ban_user_info.sex==1?'а':'')+" в этом чате [id"+msg.user_id+"|Администратором].");
					});
				});
			},
		},
		'warn':{
			aliases: ["warn","варн","предупреждение","вареник","мразь"],
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				if(!cbot.service.BSC[msg.chat_id]){
					msg.reply("Данная команда доступна только для бесед с ботом-модератором.\n\nСоздать беседу с ботом-модератором Вы можете здесь: https://bot.oblaqoo.ru/");
					return;
				}
				var acheck = cbot.service.lvl_check(msg.chat_id,msg.user_id);
				if(acheck < 1){
					msg.reply('К сожалению, Вы не администратор/модератор этого чата!');
					return;
				}
				msg.get().then(function(ddata){
					var ban_uid = (ddata.fwd_messages?ddata.fwd_messages[0].user_id:null);
					if((!ban_uid) || (ban_uid == msg.user_id)){
						msg.reply("Прикрепите сообщение нарушителя!");
						return;
					}
					ban_check = cbot.service.lvl_check(msg.chat_id,ban_uid);
					if((ban_check != 0) && (acheck != 2)){
						msg.reply("К сожалению, Вы не можете выдать предупреждение "+(ban_check == 1 ? 'модератору' : 'администратору')+"!");
						return;
					}
					chat_info = cbot.service.BSC[msg.chat_id];
					cbot.mysql.db.query('SELECT * FROM `warns` WHERE chat_id = ? AND user_id = ?', [msg.chat_id,ban_uid], function(err,result){
						if(!result[0]){
							var dd = {user_id: ban_uid, chat_id: msg.chat_id, count: 1};
							cbot.mysql.db.query('INSERT INTO `warns` SET ?', dd);
							var bd_warn_count = 1;
						} else{
							var bd_warn_count = result[0].count + 1;
							cbot.mysql.db.query('UPDATE `warns` SET `count` = ? WHERE `user_id` = ? AND `chat_id` = ?', [bd_warn_count, ban_uid, msg.chat_id]);
						}
						vk.users.get({
							user_id: ban_uid, // данные передаваемые API
							fields: 'name,lastname,sex'
						}).then(function (ban_user_info){
							ban_user_info = ban_user_info[0];
							if(bd_warn_count > chat_info.max_warns){
								cbot.mysql.db.query('INSERT INTO `ban` SET ?', {user_id: ban_uid, chat_id: msg.chat_id});
								msg.send("[id"+ban_uid+"|"+ban_user_info.first_name+" "+ban_user_info.last_name+"] забанен"+(ban_user_info.sex==1?'а':'')+" в этом чате [id"+msg.user_id+"|Администратором].");
								msg.removeChatUser(ban_uid);
							} else{
								msg.send("[id"+ban_uid+"|"+ban_user_info.first_name+" "+ban_user_info.last_name+"] получил"+(ban_user_info.sex==1?'а':'')+" предупреждение от [id"+msg.user_id+"|Администратора].\n\nВ данный момент он"+(ban_user_info.sex==1?'а':'')+" имеет "+bd_warn_count+"/"+chat_info.max_warns+" предупреждений.");
							}
						});
					});
				});
			},
		},
		'unwarn':{
			aliases: ["unwarn","унварн"],
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				if(!cbot.service.BSC[msg.chat_id]){
					msg.reply("Данная команда доступна только для бесед с ботом-модератором.\n\nСоздать беседу с ботом-модератором Вы можете здесь: https://bot.oblaqoo.ru/");
					return;
				}
				var acheck = cbot.service.lvl_check(msg.chat_id,msg.user_id);
				if(acheck < 1){
					msg.reply('К сожалению, Вы не администратор/модератор этого чата!');
					return;
				}
				msg.get().then(function(ddata){
					var ban_uid = (ddata.fwd_messages?ddata.fwd_messages[0].user_id:null);
					if((!ban_uid) || (ban_uid == msg.user_id)){
						msg.reply("Прикрепите сообщение нарушителя!");
						return;
					}
					chat_info = cbot.service.BSC[msg.chat_id];
					cbot.mysql.db.query('SELECT * FROM `warns` WHERE chat_id = ? AND user_id = ?', [msg.chat_id,ban_uid], function(err,result){
						if(!result[0]){
							msg.reply("У этого пользователя не имеется предупреждений!");
						} else{
							var bd_warn_count = result[0].count - 1;
							if(result[0].count==1){
								cbot.mysql.db.query('DELETE FROM `warns` WHERE user_id = ? AND chat_id = ?', [ban_uid, msg.chat_id]);
								msg.reply("Вы сняли последнее предупреждение для этого пользователя!");
							} else cbot.mysql.db.query('UPDATE `warns` SET `count` = ? WHERE `user_id` = ? AND `chat_id` = ?', [bd_warn_count, ban_uid, msg.chat_id]);
						}
						if(bd_warn_count){
							vk.users.get({
								user_id: ban_uid, // данные передаваемые API
								fields: 'name,lastname,sex',
								name_case: 'gen',
							}).then(function (ban_user_info){
								ban_user_info = ban_user_info[0];
								msg.send("С [id"+ban_uid+"|"+ban_user_info.first_name+" "+ban_user_info.last_name+"] снято предупреждение [id"+msg.user_id+"|Администратором].\n\nВ данный момент он"+(ban_user_info.sex==1?'а':'')+" имеет "+bd_warn_count+"/"+chat_info.max_warns+" предупреждений.");
							});
						}
					});
				});
			},
		},
		'kick':{
			aliases: ["kick","кик","выгнать","идинахуй"],
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				if(!cbot.service.BSC[msg.chat_id]){
					msg.reply("Данная команда доступна только для бесед с ботом-модератором.\n\nСоздать беседу с ботом-модератором Вы можете здесь: https://bot.oblaqoo.ru/");
					return;
				}
				var acheck = cbot.service.lvl_check(msg.chat_id,msg.user_id);
				if(acheck < 1){
					msg.reply('К сожалению, Вы не администратор/модератор этого чата!');
					return;
				}
				msg.get().then(function(ddata){
					var ban_uid = (ddata.fwd_messages?ddata.fwd_messages[0].user_id:null);
					if((!ban_uid) || (ban_uid == msg.user_id)){
						msg.reply("Прикрепите сообщение нарушителя!");
						return;
					}
					ban_check = cbot.service.lvl_check(msg.chat_id,ban_uid);
					if((ban_check != 0) && (acheck != 2)){
						msg.reply("К сожалению, Вы не можете выгнать "+(ban_check == 1 ? 'модератора' : 'администратора')+"!");
						return;
					}
					vk.users.get({
						user_id: ban_uid, // данные передаваемые API
						fields: 'name,lastname,sex'
					}).then(function (ban_user_info){
						ban_user_info = ban_user_info[0];
						msg.send("[id"+ban_uid+"|"+ban_user_info.first_name+" "+ban_user_info.last_name+"] выгнан"+(ban_user_info.sex==1?'а':'')+" из этого чата [id"+msg.user_id+"|Администратором].");
						msg.removeChatUser(ban_uid);
					});
				});
			},
		},
		'admin':{
			aliases: ["admin","makeadmin","makeadminsgreateagain!"],
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				if(!cbot.service.BSC[msg.chat_id]){
					msg.reply("Данная команда доступна только для бесед с ботом-модератором.\n\nСоздать беседу с ботом-модератором Вы можете здесь: https://bot.oblaqoo.ru/");
					return;
				}
				var acheck = cbot.service.lvl_check(msg.chat_id,msg.user_id);
				if(acheck < 2){
					msg.reply('К сожалению, Вы не администратор этого чата!');
					return;
				}
				msg.get().then(function(ddata){
					var ban_uid = (ddata.fwd_messages?ddata.fwd_messages[0].user_id:null);
					if((!ban_uid) || (ban_uid == msg.user_id)){
						msg.reply("Прикрепите сообщение будущего администратора!");
						return;
					}
					cbot.mysql.db.query('SELECT * FROM `chat_privilege` WHERE chat_id = ? AND user_id = ?', [msg.chat_id,ban_uid], function(err,result){
						if(!result[0]){
							cbot.mysql.db.query('INSERT INTO `chat_privilege` SET ?', {user_id: ban_uid, chat_id: msg.chat_id, lvl: 2});
							var bd_warn_count = 1;
						} else if(result[0].lvl==2){
							msg.reply("К сожалению, этот человек уже обладает статусом администратора");
						} else{
							var bd_warn_count = result[0].count + 1;
							cbot.mysql.db.query('UPDATE `chat_privilege` SET `lvl` = ? WHERE `user_id` = ? AND `chat_id` = ?', [2, ban_uid, msg.chat_id]);
							(cbot.service['admins'][msg.chat_id]?cbot.service['admins'][msg.chat_id].push(msg.user_id):cbot.service['admins'][msg.chat_id]=[msg.user_id]);
						}
						vk.users.get({
							user_id: ban_uid, // данные передаваемые API
							fields: 'name,lastname,sex'
						}).then(function (ban_user_info){
							ban_user_info = ban_user_info[0];
							msg.send("[id"+ban_uid+"|"+ban_user_info.first_name+" "+ban_user_info.last_name+"] получил"+(ban_user_info.sex==1?'а':'')+" статус администратора в этом чате!");
						});
					});
				});
			},
		},
		'moder':{
			aliases: ["moder","makemoder","makemodersgreateagain!"],
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				if(!cbot.service.BSC[msg.chat_id]){
					msg.reply("Данная команда доступна только для бесед с ботом-модератором.\n\nСоздать беседу с ботом-модератором Вы можете здесь: https://bot.oblaqoo.ru/");
					return;
				}
				var acheck = cbot.service.lvl_check(msg.chat_id,msg.user_id);
				if(acheck < 2){
					msg.reply('К сожалению, Вы не администратор этого чата!');
					return;
				}
				msg.get().then(function(ddata){
					var ban_uid = (ddata.fwd_messages?ddata.fwd_messages[0].user_id:null);
					if((!ban_uid) || (ban_uid == msg.user_id)){
						msg.reply("Прикрепите сообщение будущего модератора!");
						return;
					}
					cbot.mysql.db.query('SELECT * FROM `chat_privilege` WHERE chat_id = ? AND user_id = ?', [msg.chat_id,ban_uid], function(err,result){
						if(!result[0]){
							cbot.mysql.db.query('INSERT INTO `chat_privilege` SET ?', {user_id: ban_uid, chat_id: msg.chat_id, lvl: 1});
							var bd_warn_count = 1;
						} else if(result[0].lvl==1){
							msg.reply("К сожалению, этот человек уже обладает статусом модератора");
						} else{
							var bd_warn_count = result[0].count + 1;
							cbot.mysql.db.query('UPDATE `chat_privilege` SET `lvl` = ? WHERE `user_id` = ? AND `chat_id` = ?', [1, ban_uid, msg.chat_id]);
							(cbot.service['moders'][msg.chat_id]?cbot.service['moders'][msg.chat_id].push(msg.user_id):cbot.service['moders'][msg.chat_id]=[msg.user_id]);
						}
						vk.users.get({
							user_id: ban_uid, // данные передаваемые API
							fields: 'name,lastname,sex'
						}).then(function (ban_user_info){
							ban_user_info = ban_user_info[0];
							msg.send("[id"+ban_uid+"|"+ban_user_info.first_name+" "+ban_user_info.last_name+"] получил"+(ban_user_info.sex==1?'а':'')+" статус модератора в этом чате!");
						});
					});
				});
			},
		},
		'open':{
			aliases: ["open"],
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				var acheck = cbot.service.lvl_check(msg.chat_id,msg.user_id);
				if(acheck < 1){
					msg.reply('К сожалению, Вы не администратор/модератор этого чата!');
					return;
				}
				msg.reply("OpenMode активирован для этого чата. Теперь любой может вступить в чат здесь: https://vk.cc/7AjkXP");
				cbot.mysql.db.query('UPDATE `all_chats_settings` SET `open` = 1 WHERE `chat_id` = ?', [msg.chat_id]);
				cbot.service.ASC[msg.chat_id].open = 1;
			},
		},
		'close':{
			aliases: ["close"],
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				var acheck = cbot.service.lvl_check(msg.chat_id,msg.user_id);
				if(acheck < 1){
					msg.reply('К сожалению, Вы не администратор/модератор этого чата!');
					return;
				}
				msg.reply("OpenMode деактивирован для этого чата. Теперь в чат можно вступить только по приглашению участников чата");
				cbot.mysql.db.query('UPDATE `all_chats_settings` SET `open` = 0 WHERE `chat_id` = ?', [msg.chat_id]);
				cbot.service.ASC[msg.chat_id].open = 0;
			},
		},
		'rules':{
			aliases: ["rules","правила"],
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				msg.send("Правила чата:\n\n"+cbot.service.ASC[msg.chat_id].rules);
			},
		},
		'changerules':{
			aliases: ["changerules","изменитьправила"],
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				var acheck = cbot.service.lvl_check(msg.chat_id,msg.user_id);
				if(acheck < 1){
					msg.reply('К сожалению, Вы не администратор/модератор этого чата!');
					return;
				}
				if(obody.length >= 800) return msg.reply("Не больше 800 символов!");
				cbot.mysql.db.query('UPDATE `all_chats_settings` SET `rules` = ? WHERE `chat_id` = ?', [obody, msg.chat_id]);
				cbot.service.ASC[msg.chat_id].rules = obody;
				msg.send("Правила чата изменены!\n\n"+obody);
			},
		},
	},
	load:function(cbot,vk,cb){
		cbot.mysql.db.query("CREATE TABLE IF NOT EXISTS `ban` ( `id` int(11) NOT NULL AUTO_INCREMENT, `user_id` int(11) NOT NULL, `chat_id` int(11) NOT NULL, PRIMARY KEY (`id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
		cbot.mysql.db.query("CREATE TABLE IF NOT EXISTS `warns` ( `id` int(11) NOT NULL AUTO_INCREMENT, `user_id` int(11) NOT NULL, `count` int(11) NOT NULL, `chat_id` int(11) NOT NULL, PRIMARY KEY (`id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
		cb.on("mwa",function(msg){
			if((msg.action) && ((msg.action == 'chat_invite_user') || (msg.action == 'chat_invite_user_by_link'))){
				cbot.mysql.db.query('SELECT * FROM `ban` WHERE chat_id = ? AND user_id = ?', [msg.chat_id,msg.action_mid], function(err,result){
					if(!result[0]) return;
					if(msg.action == 'chat_invite_user_by_link'){
						msg.send('This user has been banned!');
						msg.removeChatUser(msg.action_mid);
					}
					chat_info = cbot.service.BSC[msg.chat_id];
					cbot.mysql.db.query('SELECT * FROM `warns` WHERE chat_id = ? AND user_id = ?', [msg.chat_id,msg.user_id], function(err,result){
						if(!result[0]){
							var dd = {user_id: msg.user_id, chat_id: msg.chat_id, count: 1};
							cbot.mysql.db.query('INSERT INTO `warns` SET ?', dd);
							var bd_warn_count = 1;
						} else{
							var bd_warn_count = result[0].count + 1;
							cbot.mysql.db.query('UPDATE `warns` SET `count` = ? WHERE `user_id` = ? AND `chat_id` = ?', [bd_warn_count, msg.user_id, msg.chat_id]);
						}
						vk.users.get({
							user_id: msg.user_id, // данные передаваемые API
							fields: 'name,lastname,sex'
						}).then(function (ban_user_info){
							ban_user_info = ban_user_info[0];
							if(bd_warn_count > chat_info.max_warns){
								cbot.mysql.db.query('INSERT INTO `ban` SET ?', {user_id: msg.user_id, chat_id: msg.chat_id});
								msg.send("[id"+msg.user_id+"|"+ban_user_info.first_name+" "+ban_user_info.last_name+"] забанен"+(ban_user_info.sex==1?'а':'')+" в этом чате за приглашение заблокированного участника.");
								msg.removeChatUser(msg.user_id);
							} else{
								msg.send("[id"+msg.user_id+"|"+ban_user_info.first_name+" "+ban_user_info.last_name+"] получил"+(ban_user_info.sex==1?'а':'')+" предупреждение за приглашение заблокированного участника.\n\nВ данный момент он"+(ban_user_info.sex==1?'а':'')+" имеет "+bd_warn_count+"/"+chat_info.max_warns+" предупреждений.");
							}
							msg.removeChatUser(msg.action_mid);
						});
					});
				});
			}
		});
	},
	sign:{
		issuer: 1,
		version: 0.2,
		trust_key: '134461f8e017528aa9b78844446b649f',
	},
}