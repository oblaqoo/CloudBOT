var chalk = require('chalk');
try {
    var config = require('./config.js');
} catch (ex) {
	console.log(chalk.cyan('[CONFIG]')+chalk.redBright(' ERR!')+chalk.yellow(' config.js was not found'));
	console.log(chalk.cyan('[CONFIG]')+chalk.yellow(' load config_default.js'));
    var config = require('./config_default.js');
}
var fs = require("fs"),
	VK = require("./vk.js"),
	mysql = require('mysql'),
	md5 = require("nodejs-md5"),
	request = require('request'),
	events = require('events'),
	http = require("http"),
	RuCaptcha = require('./rucaptcha.js'),
	cb = new events.EventEmitter(),
	unhandledRejection = require("unhandled-rejection");
var cbot = {
	callbacks: require('./'+config.modules_place+'/callbacks.js'),
	config: config,
	captcha:{
		saved:[],
	},
	service:{
		ASC:{},
		BSC:{},
		BSC_cache:[],
		flood_control:{
			step: 0,
			lock: 0,
		},
		users:{},
		bots:[449640880,336548628,432396674,251235295,449223160,409112618,418084242,470182628,470552975,472076625,471756562,470997341,417021564,429676630,307249355,440955069,462832162,466665907,392676423,348877376,463718240,400936570,367602242,431114820,371041508,426927406,436224530,437161019,355158479,437188501,354115086,353672936,352410165,352238626,371306887,372790495,373145304,409078467,401088448,400955672,395819897,409984129,415293478,415975561,390589361,416131152,384188736,381289640,420376710,375950015,423341950,426724550,374139036,406183827,438500333,98287339,451578961,305796290,305266075,342440244,452051276,272117284,270335012,268204094,258016270,256066300,452702379,455394373,456725735,234820836,459458498,1344682,191385155,311346896,447670853,442449834,340891862,340910454,341419038,442405419,442256849,441082265,348989146,336816275,331130967,329940047,316175457,319144897,446068343,319575808,321437972,324273261,443790591,419703711,463465267,406175214,379230771,371107330,235670580,395810589,222399194,401513434,313421552,181011582,16724459,5367785,442680979,340479023,342439775,441395304,441128669,344033287,441003505,432467689,348985269,436929831,349165031,351091012,445498902,447680103,15438273,468632921,209758819,211054116,469304121,455170471,454508376,289348679,309458330,450829055,310472649,449181554,360007959,432349046,420134742,383049686,399864688,416525089,387502659,404430116,409469777,414542967,405545261,402251272,407837449,413366110,408950140,412555986,382824597,429906465,429383447,430555298,428686680,374585620,375348636,420403354,377391227,459325787,470735140,358933702,443036090,244577506,472930940,157891770,472287546,472286886,438037087,355481701,319528158,457245693,6702078,329933159,370666779,461460001,454184938,404019901,408167031,390669049,459360850,414389491,413368030,468411962,462943368,468114699,395646590,462564572,448771726,292287536,237810835,470904214,364303255,474151730,208352746,402721115,413990384,452868477,469377168,1369452,414440855,475202643],
		admins:{},
		ignore:{},
		moders:{},
		counters:{
			messages: {
				all: 0,
				chats: 0,
				byuser: {},
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
		get_host:function(){
			return 'http://'+config.domain+(config.web_port==80?'':':'+config.web_port)+'/'
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
			  database: config.bd_db,
			  charset: 'utf8mb4_general_ci'
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
				console.log(chalk.cyan('[MYSQL]')+chalk.redBright(' Database connection failure'), err); 
				console.log(chalk.cyan('[MYSQL]')+chalk.redBright(' Database reconnecting...')); 
				cbot.mysql.connect(); 
			});
		},
		load:function(){ //подгрузка данных из БД
			cbot.mysql.db.query("CREATE TABLE IF NOT EXISTS `storage` ( `id` int(11) NOT NULL AUTO_INCREMENT, `chat_id` int(11) NOT NULL, `user_id` int(11) NOT NULL, `col` varchar(40) NOT NULL, `data` text NOT NULL, PRIMARY KEY (`id`), UNIQUE KEY `chat_id_user_id_col` (`chat_id`,`user_id`,`col`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
			cbot.mysql.db.query("CREATE TABLE IF NOT EXISTS `all_chats_settings` ( `chat_id` int(11) NOT NULL, `freemode` int(1) NOT NULL DEFAULT '0', `voice` int(1) NOT NULL DEFAULT '1', `open` int(1) NOT NULL DEFAULT '0', `rules` varchar(800) NOT NULL DEFAULT 'В этом чате не установлены правила. Для того, чтобы установить правила отправьте !changerules и желаемые правила чата.', UNIQUE KEY `chat_id` (`chat_id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
			cbot.mysql.db.query("CREATE TABLE IF NOT EXISTS `chat_privilege` ( `id` int(11) NOT NULL AUTO_INCREMENT, `chat_id` int(11) NOT NULL, `user_id` int(11) NOT NULL, `lvl` int(11) NOT NULL, PRIMARY KEY (`id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
			cbot.mysql.db.query("INSERT IGNORE INTO `chat_privilege` (`id`, `chat_id`, `user_id`, `lvl`) VALUES ('1', '0', '0', '0')");
			cbot.mysql.db.query("CREATE TABLE IF NOT EXISTS `chat_settings` ( `id` int(11) NOT NULL AUTO_INCREMENT, `chat_id` int(11) NOT NULL, `max_warns` int(11) NOT NULL DEFAULT '3', `antimat` int(11) NOT NULL, `time` int(11) NOT NULL, `admin` int(11) NOT NULL, PRIMARY KEY (`id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
			cbot.mysql.db.query("CREATE TABLE IF NOT EXISTS `users` ( `user_id` int(11) NOT NULL, `balance` int(11) NOT NULL, `first_name` varchar(40) NOT NULL, `last_name` varchar(40) NOT NULL, `sex` tinyint(1) NOT NULL, `nickname` varchar(40), `married` int(11) NOT NULL, `avatar` varchar(80) NOT NULL, UNIQUE KEY (`user_id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
			cbot.mysql.db.query("INSERT IGNORE INTO `chat_settings` (`id`, `chat_id`, `max_warns`, `antimat`, `time`, `admin`) VALUES ('1', '0', '0', '0', '0', '0')");
			cbot.mysql.db.query('SELECT * FROM `chat_privilege`', function(err,result){ //загрузка модеров и админов
				if(err) return console.log(chalk.cyan('[MYSQL]')+chalk.redBright(' Failed to load privileges!'), err);
				if(!result || !result[0]) return;
				for(var i = 0; i < result.length; i++){
					(cbot.service[(result[i].lvl==2?'admins':'moders')][result[i].chat_id]?cbot.service[(result[i].lvl==2?'admins':'moders')][result[i].chat_id].push(result[i].user_id):cbot.service[(result[i].lvl==2?'admins':'moders')][result[i].chat_id]=[result[i].user_id]);
				}
				console.log(chalk.cyan('[MYSQL]')+chalk.green(' Privileges successfully loaded!'));
			});
			cbot.mysql.db.query('SELECT * FROM `chat_settings`', function(err,result){ //загрузка настроек чатов
				if(err) return console.log(chalk.cyan('[MYSQL]')+chalk.redBright(' Failed to load chats settings!'), err);
				if(!result || !result[0]) return;
				for(var i = 0; i < result.length; i++){
					cbot.service.BSC[result[i].chat_id] = result[i];
					cbot.service.BSC_cache.push(result[i].chat_id);
				}
				console.log(chalk.cyan('[MYSQL]')+chalk.green(' Chats settings successfully loaded!'));
			});
			cbot.mysql.db.query('SELECT * FROM `all_chats_settings`', function(err,result){ //загрузка настроек чатов
				if(err) return console.log(chalk.cyan('[MYSQL]')+chalk.redBright(' Failed to load allchats settings!'), err);
				if(!result || !result[0]) return;
				for(var i = 0; i < result.length; i++){
					cbot.service.ASC[result[i].chat_id] = result[i];
				}
				console.log(chalk.cyan('[MYSQL]')+chalk.green(' ALLChats settings successfully loaded!'));
			});
			cbot.mysql.db.query('SELECT * FROM `users`', function(err,result){ //загрузка настроек чатов
				if(err) return console.log(chalk.cyan('[MYSQL]')+chalk.redBright(' Failed to load users data!'), err);
				if(!result || !result[0]) return;
				for(var i = 0; i < result.length; i++){
					cbot.service.users[result[i].user_id] = result[i];
				}
				console.log(chalk.cyan('[MYSQL]')+chalk.green(' Users data successfully loaded!'));
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
		getMaxPhoto:function(obj){
			let max = (obj.width>obj.height?1:0)
			return max===1?(obj.width>1280?obj.photo_2560:(obj.width>807?obj.photo_1280:(obj.width>604?obj.photo_807:(obj.width>130?obj.photo_604:(obj.width>75?obj.photo_130:obj.photo_75))))):(obj.height>1024?obj.photo_2560:(obj.height>807?obj.photo_1280:(obj.height>604?obj.photo_807:(obj.height>130?obj.photo_604:(obj.height>75?obj.photo_130:obj.photo_75)))))
		},
	},
	sandbox:{
		callbacks: require('./'+config.modules_place+'/callbacks.js'),
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
			get_host:function(){
				return 'http://'+config.domain+(config.web_port==80?'':':'+config.web_port)+'/'
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
			getMaxPhoto:function(obj){
				let max = (obj.width>obj.height?1:0)
				return max===1?(obj.width>1280?obj.photo_2560:(obj.width>807?obj.photo_1280:(obj.width>604?obj.photo_807:(obj.width>130?obj.photo_604:(obj.width>75?obj.photo_130:obj.photo_75))))):(obj.height>1024?obj.photo_2560:(obj.height>807?obj.photo_1280:(obj.height>604?obj.photo_807:(obj.height>130?obj.photo_604:(obj.height>75?obj.photo_130:obj.photo_75)))))
			},
		},
	},
}

//----------init-----------------
cbot.mysql.connect()
cbot.callbacks.load(cb, cbot)
cbot.modules.load_config()
if(config.callback.group){
	var vk = new VK(config.callback.token)
	var callback = vk.init_callback_api(config.callback.return_key, config.callback.secret_key)
	console.log(chalk.yellow('[CallBack SERVER] ')+'https://'+config.callback.domain+'/vk_callback_api')
	http.createServer(function(req, res){
		if(req.url == "/vk_callback_api")
			return callback(req, res)
		res.end("Error 404");
	}).listen(config.callback.port)
	vk.init_execute_cart(50)
} else{
	var vk = new VK(config.token)
	vk.init_execute_cart(1000);
	setTimeout(function(){vk.longpoll.start();console.log(chalk.cyan('[LongPool]')+chalk.green(' Connected!'));}, 1000)
}
var captcha = new RuCaptcha({apiKey: config.captcha.apiKey, tmpDir: config.captcha.dir, checkDelay: config.captcha.delay})
var rejectionEmitter = unhandledRejection({timeout: 20})
//-------------------------------
vk.on("message",function(event, msg){
	//if((msg.chat_id != 59) && (msg.user_id != 145301982)) return; //silent mode
	if(!cbot.service.users[msg.user_id]){
		vk.users.get({
			user_id: msg.user_id, // данные передаваемые API
			fields: 'name,lastname,sex,photo_100'
		}).then(function (user_info){
			user_info = user_info[0];
			cbot.mysql.db.query('INSERT IGNORE INTO `users` (`user_id`,`first_name`,`last_name`,`sex`,`avatar`) VALUES (?,?,?,?,?)', [msg.user_id, user_info.first_name, user_info.last_name, user_info.sex,user_info.photo_100])
			cbot.service.users[msg.user_id] = {user_id: msg.user_id, first_name: user_info.first_name, last_name: user_info.last_name, sex: user_info.sex, balance: 0, nickname: null, married: 0, avatar: user_info.photo_100};
		})
	}
	var sms = msg.body.toLowerCase().split(" ");
	cbot.sandbox.service.counters.messages.all++;
	cbot.service.counters.messages.all++;
	cbot.service.counters.messages.byuser[msg.user_id]++;
	if(cbot.service.flood_control.lock) return console.log(chalk.cyan('[FLOOD CONTROL]')+chalk.yellow(' answer blocked')+': '+chalk.cyan(msg.body));
	if(!msg.out && cbot.utils.array_find(cbot.service.bots, msg.user_id)+1) return console.log(chalk.cyan('[MESSAGE]')+chalk.yellow(' BOT')+': '+chalk.cyan(msg.body));
	cb.emit('message', msg);
	if(!cbot.modules.aliases[sms[0]]) cb.emit('mwa', msg)
	if(msg.action) cb.emit('action', msg)
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
		console.log(chalk.cyan('[MESSAGE]')+chalk.redBright(' vk.com/id'+msg.user_id+(msg.chat_id?chalk.magenta(' (chat:'+msg.chat_id+')'):''))+': '+chalk.green(msg.body));
		if((msg.user_id == 1125607941) || (msg.user_id == 100) || (msg.user_id == 333)) return;
		if(msg.chat_id){
			cbot.service.counters.messages.chats++;
			cbot.sandbox.service.counters.messages.chats++;
			var ASC = cbot.service.ASC[msg.chat_id];
			if(!ASC){
				cbot.mysql.db.query('SELECT * FROM `all_chats_settings` WHERE ?', {chat_id: msg.chat_id}, function(err,result){
					if(!result || !result[0]){
						cbot.mysql.db.query('INSERT INTO `all_chats_settings` (`chat_id`,`freemode`,`voice`) VALUES (?,?,?)', [msg.chat_id, 0, 1]);
						cbot.service.ASC[msg.chat_id] = {chat_id: msg.chat_id, freemode: 0, voice: 1, open: 0, rules: "В этом чате не установлены правила. Для того, чтобы установить правила отправьте !changerules и желаемые правила чата."};
					} else{
						cbot.service.ASC[msg.chat_id] = result[0];
					}
					ASC = cbot.service.ASC[msg.chat_id];
				});
			}
			if(!(cbot.utils.array_find(cbot.service.BSC_cache, msg.chat_id)+1)){
				cbot.service.BSC_cache.push(msg.chat_id);
				cbot.mysql.db.query('SELECT * FROM `chat_settings` WHERE ?', {chat_id: msg.chat_id}, function(err,result){
					if(!result || !result[0]) return;
					cbot.service.BSC[msg.chat_id] = result[0];
				});
				cbot.mysql.db.query('SELECT * FROM `chat_privilege` WHERE ?', {chat_id: msg.chat_id}, function(err,result){
					if(err) return console.log(chalk.cyan('[MYSQL]')+chalk.redBright(' Failed to load privileges for chat: '+msg.chat_id+'!'), err);
					if(!result || !result[0]) return;
					for(var i = 0; i < result.length; i++){
						(cbot.service[(result[i].lvl==2?'admins':'moders')][msg.chat_id]?cbot.service[(result[i].lvl==2?'admins':'moders')][msg.chat_id].push(result[i].user_id):cbot.service[(result[i].lvl==2?'admins':'moders')][msg.chat_id]=[result[i].user_id]);
					}
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
			cb.emit('captcha', cid);
			cb.on("captcha:"+cid, function(){
				if(cbot.captcha.saved[cid] && cbot.captcha.saved[cid].answer){
					data.submit(cbot.captcha.saved[cid].answer);
					return cbot.captcha.saved.splice(cid-1, 1);;
				}
			});
		} else console.log(chalk.cyan('[CAPCHA] ')+chalk.redBright('ERR! ')+"Resource web_panel was not loaded!")
});
rejectionEmitter.on("unhandledRejection", (error, promise) => {
    console.log(chalk.redBright('[ERROR] '), error)
	if(error.error && error.error.error_code == 9){
		cbot.service.flood_control.step++
		cbot.service.flood_control.lock++
		setTimeout(function(){cbot.service.flood_control.lock>0?cbot.service.flood_control.lock--:0}, (cbot.service.flood_control.step==1?0:cbot.service.flood_control.step*30)+cbot.service.flood_control.lock*20+"000")
		setTimeout(function(){cbot.service.flood_control.step>0?cbot.service.flood_control.step--:0}, 600000)
    }
});
rejectionEmitter.on("rejectionHandled", (error, promise) => {
    console.log(chalk.redBright('[REJECTION] '), error);
})

//captcha fix
setInterval(function(){cbot.service.counters.captcha=0}, 300000);