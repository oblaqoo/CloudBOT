const app = require('express')(),
	handlebars = require('handlebars'),
	fs = require('fs'),
	url = require('url'),
	server = require('http').Server(app),
	io = require('socket.io')(server);
module.exports = {
	data:{
		config: cbot.config,
		cbot: cbot,
		starttime: cbot.service.counters.start,
		menu:[
			{
				name: 'CloudBOT',
				path: '/index.html',
			},
			{
				name: 'Статистика',
				path: '/stats.html',
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
		var mdl = this;
		app.get('/api', function(req, res, next){
			console.log(req);
		});
		app.get(/\.(css|js|png|jpg|mp4|mp3)/, function(req, res, next){
			const urlParsed = url.parse(req.url, true);
			let path = urlParsed.pathname;
			res.sendFile(__dirname+'/web/'+path);
		});
		app.get(/.*/, function(req, res, next){
			const urlParsed = url.parse(req.url, true);
			let path = urlParsed.pathname;
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
		})
	},
	sign:{
		issuer: 1,
		version: 0.1,
		trust_key: 'bd2b4acdff586d8a5e18931716288cf2',
	},
}