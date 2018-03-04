const app = require('express')(),
	handlebars = require('handlebars'),
	fs = require('fs'),
	url = require('url'),
	cookieParser = require('cookie-parser'),
	server = require('http').Server(app),
	io = require('socket.io')(server);
module.exports = {
	payment_save:function(rk){
		this.rk = rk
	},
	data:{
		menu:[
			{
				name: 'CloudBOT',
				path: '/index.html',
			},
			{
				name: 'Статистика',
				path: '/stats.html',
			},
			{
				name: 'Капча',
				path: '/captcha.html',
			},
		],
	},
	e404:function(res){
		var mdl = this;
		fs.readFile(__dirname+'/web/errors/404.html', 'utf-8', function(error, source){
			if(error){
				res.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
				res.end("Internal Server Error");
				return;
			}
			res.writeHead(404, {'Content-Type': 'text/html; charset=utf-8'});
			var template = handlebars.compile(source);
			res.end(template(mdl.data));
		});
	},
	load:function(cbot,vk,cb){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения
		cbot.mysql.db.query("CREATE TABLE IF NOT EXISTS `secure_tokens` (`id` int NOT NULL AUTO_INCREMENT PRIMARY KEY, `access_token` varchar(100) NOT NULL, `user_id` int(11) NOT NULL, FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)) ENGINE='InnoDB';");
		setInterval(function(){
			cbot.mysql.db.query("TRUNCATE TABLE `secure_tokens`")
			cb.emit("tokenstrunkated")
		}, 1800000)
		var mdl = this;
		mdl.data.config = cbot.config;
		mdl.data.cbot = cbot;
		mdl.data.starttime = cbot.service.counters.start;
		mdl.data.menu.push({
				name: 'Личный Кабинет',
				path: 'https://oauth.vk.com/authorize?client_id=5951449&display=page&redirect_uri='+cbot.service.get_host()+'api/auth&scope=offline&response_type=code&v=5.60',
			});
		app.use(cookieParser());
		app.get('/api/:mthd', function(req, res, next){
			let method = req.param('mthd', "def")
			var m = null
			try{
				require("./web/api/"+method+".js")(req, res, cbot, vk)
			} catch(e){
				require("./web/api/def.js")(req, res, cbot, vk)
			}
		});
		app.get(/\.(css|js|png|jpg|mp4|mp3)/, function(req, res, next){
			const urlParsed = url.parse(req.url, true);
			let path = urlParsed.pathname;
			res.sendFile(__dirname+'/web/'+path);
		});
		app.get(/.*/, function(req, res, next){
			const urlParsed = url.parse(req.url, true);
			let path = urlParsed.pathname;
			if(req.param('logout')){
				res.clearCookie('access_token')
				res.clearCookie('user_id')
			}
			fs.readFile(__dirname+'/web/'+(path && path != '/'?path:'index.html'), 'utf-8', function(error, source){
				if(error){
					return mdl.e404(res);
				}
				res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
				var template = handlebars.compile(source);
				res.end(template({data: mdl.data, path: (path && path != '/'?path:'/index.html')}));
			});
		});
		server.listen(cbot.config.web_port, function(){
			console.log('Server running on '+cbot.config.web_port);
			console.log('WebPanel by oblaqoo successfully loaded!');
		});
		io.on('connection', function (socket){
			socket.emit('start_change', { starttime: cbot.service.counters.start });
			socket.emit('msg_change', { count: cbot.service.counters.messages.all });
			cb.on("message",function(msg){
				socket.emit('msg_change', { count: cbot.service.counters.messages.all });
			});
			cb.on("captcha",function(cid){
				socket.emit('captcha_new', { id: cid, src: cbot.captcha.saved[cid].src });
			});
			cb.on("tokenstrunkated",function(cid){
				io.sockets.emit('logout')
			});
			socket.on('cans', function(cpt) {
				if(!cbot.captcha.saved[cpt.id]) return;
				cbot.captcha.saved[cpt.id].answer = cpt.ans
				cb.emit("captcha:"+cpt.id);
			});
		})
	},
	sign:{
		issuer: 1,
		version: 0.1,
		trust_key: 'bd2b4acdff586d8a5e18931716288cf2',
	},
}