var os = require('os');
module.exports = function(req, res, cbot, vk){
	res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
	var loads = os.loadavg();
	var percent = Math.round((loads[0]<1?loads[0]*100:99));
	res.end(JSON.stringify({cpu: percent}))
}