var config = require('./config.js');
var fs = require("fs");
var VK = require("VK-Promise"),
    vk = new VK(config.token);
const mysql = require('mysql');
var md5 = require("nodejs-md5");
var request = require('request');
var chalk = require('chalk');
var events = require('events');
var stdin = process.openStdin();
var cbot = {
	service:{
		ASC:{},
		BSC:{},
		BSC_cache:[],
		admins:{},
		moders:{},
		counters:{
			messages: {
				all: 0,
				chats: 0,
				prv:function(){
					return cbot.service.counters.messages.all - cbot.service.counters.messages.chats;
				},
			},
			start: Math.round(+new Date()/1000),
		},
		is_admin:function(chat_id, user_id){
			return (cbot.utils.array_find(cbot.service.admins[chat_id],user_id)+1?1:0);
		},
		is_moder:function(chat_id, user_id){
			return (cbot.utils.array_find(cbot.service.moders[chat_id],user_id)+1?1:0);
		},
		lvl_check:function(chat_id, user_id){
			return (cbot.utils.array_find(cbot.service.admins[chat_id],user_id)+1?2:(cbot.utils.array_find(cbot.service.moders[chat_id],user_id)+1?1:0));
		},
	},
	modules:{
		aliases:{},
		aliases_with_console:{},
		loaded:{},
		trusted:[],
		load_config:function(){ //загрузка модулей
			for(var mi = 0; mi < config.modules.length; mi++){
				cbot.modules.loaded[config.modules[mi]] = require('./'+config.modules_place+'/'+config.modules[mi]+'.js');
				if(cbot.modules.loaded[config.modules[mi]].sign) cbot.trust.check(config.modules[mi]);
				for(var vi = 0; vi < cbot.modules.loaded[config.modules[mi]].aliases.length; vi++){
					if(cbot.modules.loaded[config.modules[mi]].msg) cbot.modules.aliases[cbot.modules.loaded[config.modules[mi]].aliases[vi]] = config.modules[mi];
					if(cbot.modules.loaded[config.modules[mi]].con) cbot.modules.aliases_with_console[cbot.modules.loaded[config.modules[mi]].aliases[vi]] = config.modules[mi];
					if((cbot.modules.loaded[config.modules[mi]].load) && (!cbot.modules.loaded[config.modules[mi]].sign)) cbot.modules.loaded[config.modules[mi]].load(cbot.sandbox, vk, cb);
				}
				console.log(chalk.cyan('[MODULES]')+chalk.green(' Module '+chalk.yellow(config.modules[mi])+' loaded'));
			}
			console.log(chalk.cyan('[MODULES]')+chalk.blueBright(' Loading modules completed!'));
		},
		load:function(module){ //загрузка модуля
			cbot.modules.loaded[module] = require('./'+config.modules_place+'/'+module+'.js');
			if(cbot.modules.loaded[module].sign) cbot.trust.check(module);
			for(var vi = 0; vi < cbot.modules.loaded[module].aliases.length; vi++){
				if(cbot.modules.loaded[module].msg) cbot.modules.aliases[cbot.modules.loaded[module].aliases[vi]] = module;
				if(cbot.modules.loaded[module].con) cbot.modules.aliases_with_console[cbot.modules.loaded[module].aliases[vi]] = module;
				if(cbot.modules.loaded[module].load) cbot.modules.loaded[module].load(cbot.sandbox, vk, cb);
			}
			console.log(chalk.cyan('[MODULES]')+chalk.green(' Module '+chalk.yellow(module)+' loaded'));
		},
		unload:function(module){
			if(cbot.modules.loaded[module])
				for(var vi = 0; vi < cbot.modules.loaded[module].aliases.length; vi++){
					if(cbot.modules.loaded[module].msg) cbot.modules.aliases[cbot.modules.loaded[module].aliases[vi]] = null;
					if(cbot.modules.loaded[module].con) cbot.modules.aliases_with_console[cbot.modules.loaded[module].aliases[vi]] = null;
				}
			cbot.modules.loaded[module] = null;
			console.log(chalk.cyan('[MODULES]')+chalk.green(' Module '+chalk.yellow(module)+' unloaded'));
		},
	},
	mysql:{
		db:null,
		connect:function(){ //подключение к бд
			cbot.mysql.db = mysql.createConnection({
			  host: config.bd_host,
			  user: config.bd_user,
			  password: config.bd_password,
			  database: config.bd_db
			});
			cbot.mysql.db.connect(function(err) {
			  if(err){
				console.error(chalk.cyan('[MYSQL]')+chalk.redBright(" Database connection error"));
			  }else{
				console.info(chalk.cyan('[MYSQL]')+chalk.blueBright(" Database connection successful!"));
				cbot.mysql.load();
			  }
			});
			cbot.mysql.db.on('error', function(err) { 
				console.log(chalk.cyan('[MYSQL]')+chalk.redBright(' Database connection failure')); 
				console.log(chalk.cyan('[MYSQL]')+chalk.redBright(' Database reconnecting...')); 
				cbot.mysql.connect(); 
			});
		},
		load:function(){ //подгрузка данных из БД
			cbot.mysql.db.query("CREATE TABLE IF NOT EXISTS `all_chats_settings` ( `chat_id` int(11) NOT NULL, `freemode` int(1) NOT NULL DEFAULT '0', `voice` int(1) NOT NULL DEFAULT '1', `open` int(1) NOT NULL DEFAULT '0', `rules` varchar(800) NOT NULL DEFAULT 'В этом чате не установлены правила. Для того, чтобы установить правила отправьте !changerules и желаемые правила чата.', UNIQUE KEY `chat_id` (`chat_id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
			cbot.mysql.db.query("CREATE TABLE IF NOT EXISTS `chat_privilege` ( `id` int(11) NOT NULL AUTO_INCREMENT, `chat_id` int(11) NOT NULL, `user_id` int(11) NOT NULL, `lvl` int(11) NOT NULL, PRIMARY KEY (`id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
			cbot.mysql.db.query("INSERT INTO IF NOT EXISTS `chat_privilege` (`id`, `chat_id`, `user_id`, `lvl`) VALUES ('1', '0', '0', '0')");
			cbot.mysql.db.query("CREATE TABLE IF NOT EXISTS `chat_settings` ( `id` int(11) NOT NULL AUTO_INCREMENT, `chat_id` int(11) NOT NULL, `max_warns` int(11) NOT NULL DEFAULT '3', `antimat` int(11) NOT NULL, `time` int(11) NOT NULL, `admin` int(11) NOT NULL, PRIMARY KEY (`id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
			cbot.mysql.db.query("INSERT INTO IF NOT EXISTS `chat_settings` (`id`, `chat_id`, `max_warns`, `antimat`, `time`, `admin`) VALUES ('1', '0', '0', '0', '0', '0')");
			cbot.mysql.db.query('SELECT * FROM `chat_privilege`', function(err,result){ //загрузка модеров и админов
				if(!result[0]) return console.log(chalk.cyan('[MYSQL]')+chalk.redBright(' Failed to load privileges!'));
				for(var i = 0; i < result.length; i++){
					(cbot.service[(result[i].lvl==2?'admins':'moders')][result[i].chat_id]?cbot.service[(result[i].lvl==2?'admins':'moders')][result[i].chat_id].push(result[i].user_id):cbot.service[(result[i].lvl==2?'admins':'moders')][result[i].chat_id]=[result[i].user_id]);
				}
				console.log(chalk.cyan('[MYSQL]')+chalk.green(' Privileges successfully loaded!'));
			});
			cbot.mysql.db.query('SELECT * FROM `chat_settings`', function(err,result){ //загрузка настроек чатов
				if(!result[0]) return console.log(chalk.cyan('[MYSQL]')+chalk.redBright(' Failed to load chats settings!'));
				for(var i = 0; i < result.length; i++){
					if(!result[0]) return;
					cbot.service.BSC[result[0].chat_id] = result[0];
					cbot.service.BSC_cache.push(result[0].chat_id);
				}
				console.log(chalk.cyan('[MYSQL]')+chalk.green(' Chats settings successfully loaded!'));
			});
		},
	},
	trust:{
		check:function(module){
			var trust_name = module;
			var trld = cbot.modules.loaded[module];
			md5.file.quiet('./'+config.modules_place+'/'+module+'.js', function(err, md5){
				if(!err){
					request('https://api.oblaqoo.ru/secure.trustCheck?trust_key=2_'+trld.sign.issuer+'_'+trld.sign.trust_key+'&hash='+md5+'&version='+trld.sign.version, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							var info = JSON.parse(body);
							if((info.access_level>=1) || (config.dev_mode)){
								cbot.modules.trusted.push(trust_name);
								console.log(chalk.cyan('[TRUST CONTROL] ')+chalk.yellow(trust_name+' v'+trld.sign.version)+': '+chalk.cyan('trusted! Access level: '+(config.dev_mode?'DEV':info.access_level)));
								if(trld.load) trld.load(cbot, vk, cb);
							} else{ 
								console.log(chalk.cyan('[TRUST CONTROL] ')+chalk.yellow(trust_name+' v'+trld.sign.version)+': '+chalk.redBright('Control of trust has not passed!'),'md5: '+md5);
								if(trld.load) trld.load(cbot.sandbox, vk, cb);
							}
						}
					});
				}
			});
		},
	},
	utils:{ //всякая служебная дичь
		rand:function(min_random, max_random){
			var range = max_random - min_random + 1;
			return Math.floor(Math.random()*range) + min_random;
		},
		array_find:function(array, value){
		  for (var i = 0; i < array.length; i++) {
			if (array[i] == value) return i;
		  }
		  return -1;
		},
		addZero:function(i){
			return (i < 10)? "0" + i: i;
		},
		chtime:function(sec){
			var h = sec/3600 ^ 0 ;
			var m = (sec-h*3600)/60 ^ 0 ;
			var s = sec-h*3600-m*60 ;
			return (h<10?"0"+h:h)+":"+(m<10?"0"+m:m)+":"+(s<10?"0"+s:s);
		},
	},
	sandbox:{
		service:{
			is_admin:function(chat_id, user_id){
				return cbot.service.is_admin(chat_id, user_id);
			},
			is_moder:function(chat_id, user_id){
				return cbot.service.is_moder(chat_id, user_id);
			},
			lvl_check:function(chat_id, user_id){
				return cbot.service.lvl_check(chat_id, user_id);
			},
			counters:{
				messages: {
					all: 0,
					chats: 0,
					prv:function(){
						return cbot.service.counters.messages.all - cbot.service.counters.messages.chats;
					},
				},
				start: Math.round(+new Date()/1000),
			},
		},
		utils:{
			rand:function(min_random, max_random){
				return cbot.utils.rand(min_random, max_random);
			},
			array_find:function(array, value){
				return cbot.utils.array_find(array, value);
			},
			addZero:function(i){
				return cbot.utils.addZero(i);
			},
			chtime:function(sec){
				return cbot.utils.chtime(sec);
			},
		},
	},
}
var cb = new events.EventEmitter();

//----------init-----------------
cbot.mysql.connect();
cbot.modules.load_config();
setTimeout(function(){vk.longpoll.start();console.log(chalk.cyan('[LongPool]')+chalk.green(' Connected!'));}, 4000);
//-------------------------------
vk.on("message",function(event, msg){
	cbot.sandbox.service.counters.messages.all++;
	cbot.service.counters.messages.all++;
	if(msg.out==true)console.log(chalk.cyan('[MESSAGE]')+chalk.magenta(' OUT')+': '+chalk.yellow(msg.body));
	if(msg.out == false){
		//if(msg.chat_id==59) console.log(msg);
		console.log(chalk.cyan('[MESSAGE]')+chalk.redBright(' vk.com/id'+msg.user_id+(msg.chat_id?chalk.magenta(' (chat:'+msg.chat_id+')'):''))+': '+chalk.green(msg.body));
		if((msg.user_id == 1125607941) || (msg.user_id == 100) || (msg.user_id == 333)) return;
		if(msg.chat_id){
			cbot.service.counters.messages.chats++;
			cbot.sandbox.service.counters.messages.chats++;
			var ASC = cbot.service.ASC[msg.chat_id];
			if(!ASC){
				cbot.mysql.db.query('SELECT * FROM `all_chats_settings` WHERE ?', {chat_id: msg.chat_id}, function(err,result){
					if(!result[0]){
						cbot.mysql.db.query('INSERT INTO `all_chats_settings` (`chat_id`,`freemode`,`voice`) VALUES ?', [msg.chat_id, 0, 1]);
						cbot.service.ASC[msg.chat_id] = {chat_id: msg.chat_id, freemode: 0, voice: 1, open: 0, rules: "В этом чате не установлены правила. Для того, чтобы установить правила отправьте !changerules и желаемые правила чата."};
					} else{
						cbot.service.ASC[msg.chat_id] = result[0];
					}
					ASC = cbot.service.ASC[msg.chat_id];
				});
			}
			if(!cbot.utils.array_find(cbot.service.BSC_cache, msg.chat_id)+1){
				cbot.service.BSC_cache.push(msg.chat_id);
				cbot.mysql.db.query('SELECT * FROM `chat_settings` WHERE ?', {chat_id: msg.chat_id}, function(err,result){
					if(!result[0]) return;
					cbot.service.BSC[msg.chat_id] = result[0];
				});
			}
		}
		
		//cmds
		var sms = msg.body.toLowerCase().split(" ");
		switch(sms[0]){
			case 'v':
			case 'version':
				msg.reply(config.v);
				break;
			default:
				cb.emit('message', msg);
				if(cbot.modules.loaded[cbot.modules.aliases[sms[0]]].msg)cbot.modules.loaded[cbot.modules.aliases[sms[0]]].msg((cbot.utils.array_find(cbot.modules.trusted,cbot.modules.aliases[sms[0]])+1?cbot:cbot.sandbox),vk,msg,msg.body,sms[0],msg.body.replace(sms[0]+" ",""));
				break;
		}
	   
		//actions
		if(msg.action == "chat_kick_user"){
			msg.send("хах ливнул петушара");
		}
	}
});
stdin.on('data', function(chunk){
	var cmd = chunk.toString('utf8').toLowerCase().replace("\n","").split(" ");
	switch(cmd[0]){
		case 'v':
		case 'version':
			console.log(config.v);
			break;
		case 'reload':
			vk.longpoll.stop().then(function(data){
				console.log(chalk.cyan('[LongPool]')+chalk.redBright(' Disconnected!'));
				console.log(chalk.cyan('[RELOAD]')+chalk.redBright(' Unload modules...'));
				cbot.modules.aliases = {};
				cbot.modules.aliases_with_console = {};
				cbot.modules.loaded = {};
				cbot.modules.load_config();
				cbot.mysql.db.end(function(err){
					if(err) return console.log(chalk.cyan('[RELOAD]')+chalk.redBright(err));
					console.log(chalk.cyan('[RELOAD]')+chalk.redBright(" Database connection ended"));
				});
				cbot.mysql.connect();
				setTimeout(function(){vk.longpoll.start();console.log(chalk.cyan('[LongPool]')+chalk.green(' Connected!'));}, 4000);
			});
			break;
		case 'start':
			cbot.modules.load(cmd[1]);
			break;
		case 'stop':
			cbot.modules.unload(cmd[1]);
			break;
		case 'restart':
			cbot.modules.load(cmd[1]);
			setTimeout(function(){cbot.modules.unload(cmd[1])},1000);
			break;
		default:
			if(cbot.modules.aliases_with_console[cmd[0]]) cbot.modules.loaded[cbot.modules.aliases_with_console[cmd[0]]].con((cbot.utils.array_find(cbot.modules.trusted,cbot.modules.aliases[cmd[0]])+1?cbot:cbot.sandbox),vk,chunk.toString('utf8'),cmd[0],cmd,chunk.toString('utf8').replace(cmd[0]+" ",""));
			break;
	}
});