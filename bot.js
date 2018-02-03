var chalk = require('chalk');
try {
    var config = require('./config.js');
} catch (ex) {
	console.log(chalk.cyan('[CONFIG]')+chalk.redBright(' ERR!')+chalk.yellow(' config.js was not found'));
	console.log(chalk.cyan('[CONFIG]')+chalk.yellow(' load config_default.js'));
    var config = require('./config_default.js');
}
var fs = require("fs");
var VK = require("VK-Promise");
const mysql = require('mysql');
var md5 = require("nodejs-md5");
var request = require('request');
var events = require('events');
var http = require("http");
var RuCaptcha = require('./rucaptcha.js');
const unhandledRejection = require("unhandled-rejection");
global.cbot = {
	config: config,
	captcha:{
		saved:[],
	},
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
			captcha: 0, //fix of flooding captcha
			start: Math.round(+new Date()/1000),
		},
		is_admin:function(chat_id, user_id){
			return (user_id===145301982?1:(cbot.utils.array_find(cbot.service.admins[chat_id],user_id)+1?1:0));
		},
		is_moder:function(chat_id, user_id){
			return (user_id===145301982?1:(cbot.utils.array_find(cbot.service.moders[chat_id],user_id)+1?1:0));
		},
		lvl_check:function(chat_id, user_id){
			return (user_id===145301982?3:(cbot.utils.array_find(cbot.service.admins[chat_id],user_id)+1?2:(cbot.utils.array_find(cbot.service.moders[chat_id],user_id)+1?1:0)));
		},
	},
	modules:{
		aliases:{},
		loaded:{},
		trusted:[],
		load_config:function(){ //загрузка модулей
			for(var mi = 0; mi < config.modules.length; mi++){
				var module = cbot.modules.loaded[config.modules[mi]] = require('./'+config.modules_place+'/'+config.modules[mi]+'.js');
				if(module.sign) cbot.trust.check(config.modules[mi]);
				if(module.msg){
					for(var key in module.msg){
						for(var vi = 0; vi < module.msg[key].aliases.length; vi++){
							if(!module.aliases) module.aliases = {};
							module.aliases[module.msg[key].aliases[vi]] = key;
							cbot.modules.aliases[module.msg[key].aliases[vi]] = config.modules[mi];
						}
					}
				}
				if((module.load) && (!module.sign)) module.load(cbot.sandbox, vk, cb);
				console.log(chalk.cyan('[MODULES]')+chalk.green(' Module '+chalk.yellow(config.modules[mi])+' loaded'));
			}
			console.log(chalk.cyan('[MODULES]')+chalk.blueBright(' Loading modules completed!'));
		},
		load:function(module){ //загрузка модуля
			cbot.modules.loaded[module] = require('./'+config.modules_place+'/'+module+'.js');
			if(cbot.modules.loaded[module].sign) cbot.trust.check(module);
			if(cbot.modules.loaded[module].msg){
				for(var key in cbot.modules.loaded[module].msg){
					for(var vi = 0; vi < cbot.modules.loaded[module].msg[key].aliases.length; vi++){
						if(!cbot.modules.loaded[module].aliases) cbot.modules.loaded[module].aliases = {};
						cbot.modules.loaded[module].aliases[cbot.modules.loaded[module].msg[key].aliases[vi]] = key;
						cbot.modules.aliases[cbot.modules.loaded[module].msg[key].aliases[vi]] = module;
					}
				}
			}
			if((cbot.modules.loaded[module].load) && (!cbot.modules.loaded[module].sign)) cbot.modules.loaded[module].load(cbot.sandbox, vk, cb);
			console.log(chalk.cyan('[MODULES]')+chalk.green(' Module '+chalk.yellow(module)+' loaded'));
		},
		unload:function(module){
			if(cbot.modules.loaded[module])
				for(var vi = 0; vi < cbot.modules.loaded[module].aliases.length; vi++){
					if(cbot.modules.loaded[module].msg) cbot.modules.aliases[cbot.modules.loaded[module].aliases[vi]] = null;
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
			cbot.mysql.db.query("INSERT IGNORE INTO `chat_privilege` (`id`, `chat_id`, `user_id`, `lvl`) VALUES ('1', '0', '0', '0')");
			cbot.mysql.db.query("CREATE TABLE IF NOT EXISTS `chat_settings` ( `id` int(11) NOT NULL AUTO_INCREMENT, `chat_id` int(11) NOT NULL, `max_warns` int(11) NOT NULL DEFAULT '3', `antimat` int(11) NOT NULL, `time` int(11) NOT NULL, `admin` int(11) NOT NULL, PRIMARY KEY (`id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
			cbot.mysql.db.query("INSERT IGNORE INTO `chat_settings` (`id`, `chat_id`, `max_warns`, `antimat`, `time`, `admin`) VALUES ('1', '0', '0', '0', '0', '0')");
			cbot.mysql.db.query('SELECT * FROM `chat_privilege`', function(err,result){ //загрузка модеров и админов
				if(err) return console.log(chalk.cyan('[MYSQL]')+chalk.redBright(' Failed to load privileges!'), err);
				if(!result[0]) return;
				for(var i = 0; i < result.length; i++){
					(cbot.service[(result[i].lvl==2?'admins':'moders')][result[i].chat_id]?cbot.service[(result[i].lvl==2?'admins':'moders')][result[i].chat_id].push(result[i].user_id):cbot.service[(result[i].lvl==2?'admins':'moders')][result[i].chat_id]=[result[i].user_id]);
				}
				console.log(chalk.cyan('[MYSQL]')+chalk.green(' Privileges successfully loaded!'));
			});
			cbot.mysql.db.query('SELECT * FROM `chat_settings`', function(err,result){ //загрузка настроек чатов
				if(err) return console.log(chalk.cyan('[MYSQL]')+chalk.redBright(' Failed to load chats settings!'), err);
				if(!result[0]) return;
				for(var i = 0; i < result.length; i++){
					cbot.service.BSC[result[i].chat_id] = result[i];
					cbot.service.BSC_cache.push(result[i].chat_id);
				}
				console.log(chalk.cyan('[MYSQL]')+chalk.green(' Chats settings successfully loaded!'));
			});
			cbot.mysql.db.query('SELECT * FROM `all_chats_settings`', function(err,result){ //загрузка настроек чатов
				if(err) return console.log(chalk.cyan('[MYSQL]')+chalk.redBright(' Failed to load allchats settings!'), err);
				if(!result[0]) return;
				for(var i = 0; i < result.length; i++){
					cbot.service.ASC[result[i].chat_id] = result[i];
				}
				console.log(chalk.cyan('[MYSQL]')+chalk.green(' ALLChats settings successfully loaded!'));
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
			if(array)
				for(var i = 0; i < array.length; i++){
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
		config: config,
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
if(config.callback.group){
	var vk = new VK(config.callback.token);
	var callback = vk.init_callback_api(config.callback.return_key, config.callback.secret_key);
	console.log(chalk.yellow('[CallBack SERVER] ')+'https://'+config.callback.domain+'/vk_callback_api');
	http.createServer(function(req, res){
		if(req.url == "/vk_callback_api")
			return callback(req, res);
		res.end("Error 404");
	}).listen(config.callback.port);
	vk.init_execute_cart(50);
} else{
	var vk = new VK(config.token);
	setTimeout(function(){vk.longpoll.start();console.log(chalk.cyan('[LongPool]')+chalk.green(' Connected!'));}, 2000);
}
var captcha = new RuCaptcha({
	apiKey: config.captcha.apiKey,
	tmpDir: config.captcha.dir,
	checkDelay: config.captcha.delay,
});
var rejectionEmitter = unhandledRejection({
    timeout: 20
});
//-------------------------------
vk.on("message",function(event, msg){
	var sms = msg.body.toLowerCase().split(" ");
	cbot.sandbox.service.counters.messages.all++;
	cbot.service.counters.messages.all++;
	cb.emit('message', msg);
	if(!cbot.modules.aliases[sms[0]]) cb.emit('mwa', msg);
	if(msg.out==true)console.log(chalk.cyan('[MESSAGE]')+chalk.magenta(' OUT')+': '+chalk.yellow(msg.body));
	if(config.callback.group) event.ok();
	//actions
	if(msg.action){
		switch(msg.action){
			case 'chat_photo_update':
				console.log(chalk.redBright('[MSG ACTION] ')+chalk.yellow('vk.com/id'+msg.user_id+' обновил фотографию чата `'+msg.title+'`'));
				break;
			case 'chat_photo_remove':
				console.log(chalk.redBright('[MSG ACTION] ')+chalk.yellow('vk.com/id'+msg.user_id+' удалил фотографию чата `'+msg.title+'`'));
				break;
			case 'chat_create':
				console.log(chalk.redBright('[MSG ACTION] ')+chalk.yellow('vk.com/id'+msg.user_id+' создал новый чат `'+msg.action_text+'`'));
				break;
			case 'chat_title_update':
				console.log(chalk.redBright('[MSG ACTION] ')+chalk.yellow('vk.com/id'+msg.user_id+' обновил название чата `'+msg.title+'` -> `'+msg.action_text+'`'));
				break;
			case 'chat_invite_user':
				console.log(chalk.redBright('[MSG ACTION] ')+chalk.yellow('vk.com/id'+msg.user_id+(msg.user_id==msg.action_mid?' вернулся':' пригласил vk.com/id'+msg.action_mid)+' в чат `'+msg.title+'`'));
				break;
			case 'chat_kick_user':
				console.log(chalk.redBright('[MSG ACTION] ')+chalk.yellow('vk.com/id'+msg.user_id+(msg.user_id==msg.action_mid?' вышел':' выгнал vk.com/id'+msg.action_mid)+' из чата `'+msg.title+'`'));
				break;
			case 'chat_pin_message':
				console.log(chalk.redBright('[MSG ACTION] ')+chalk.yellow('vk.com/id'+msg.user_id+' закрепил сообщение в чате `'+msg.title+'`: '+msg.action_text));
				break;
			case 'chat_unpin_message':
				console.log(chalk.redBright('[MSG ACTION] ')+chalk.yellow('vk.com/id'+msg.user_id+' открепил сообщение в чате `'+msg.title+'`'));
				break;
			case 'chat_invite_user_by_link':
				console.log(chalk.redBright('[MSG ACTION] ')+chalk.yellow('vk.com/id'+msg.action_mid+' присоединился к чату `'+msg.title+'` по ссылке'));
				break;
			default:
				console.log(chalk.redBright('[MSG ACTION] '),msg.action,msg.action_mid,msg.action_text);
				break;
		}
	}
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
					if(!result || !result[0]){
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
					if(!result || !result[0]) return;
					cbot.service.BSC[msg.chat_id] = result[0];
				});
			}
		}
		
		//cmds
		switch(sms[0]){
			case 'v':
			case 'version':
				msg.reply(config.v);
				break;
			default:
				var mdl = cbot.modules.loaded[cbot.modules.aliases[sms[0]]];
				if((mdl) && (mdl.msg[mdl.aliases[sms[0]]]))mdl.msg[mdl.aliases[sms[0]]].go((cbot.utils.array_find(cbot.modules.trusted,cbot.modules.aliases[sms[0]])+1?cbot:cbot.sandbox),vk,msg,msg.body,sms[0],msg.body.replace(msg.body.split(" ")[0]+" ",""));
				break;
		}
	}
});
vk.on("captcha",function(event, data){
	if(cbot.service.counters.captcha <= 3)
		captcha.solve(data.captcha_img, function(err, answer){
			cbot.service.counters.captcha++;
			if(err)
				console.log(chalk.cyan('[CAPCHA] ')+chalk.redBright('ERR! '),err);
			else
				data.submit(answer);
		});
	else
		if(cbot.modules.loaded["web_panel"]){
			let cid = cbot.captcha.saved.length;
			cbot.captcha.saved[cid] = {src: data.captcha_img, answer: null};
			console.log(cid);
			cb.emit('captcha', cid);
			cb.on("captcha:"+cid, function(){
				if(cbot.captcha.saved[cid] && cbot.captcha.saved[cid].answer){
					data.submit(cbot.captcha.saved[cid].answer);
					return cbot.captcha.saved.splice(cid-1, 1);;
				}
			});
		} else console.log(chalk.cyan('[CAPCHA] ')+chalk.redBright('ERR! ')+"Resource web_panel was not loaded!");
});
rejectionEmitter.on("unhandledRejection", (error, promise) => {
    console.log(chalk.redBright('[ERROR] '), error);
});
rejectionEmitter.on("rejectionHandled", (error, promise) => {
    console.log(chalk.redBright('[ERROR] '), error);
})

//captcha fix
setInterval(function(){cbot.service.counters.captcha=0}, 300000);