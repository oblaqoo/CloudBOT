var request = require('request');
module.exports = function(req, res, cbot, vk){
	if(!req.param('code')) return res.end("Невозможно идентифицировать Вас!")
	return new Promise(function(resolve, reject){
		request('https://oauth.vk.com/access_token?client_id=5951449&client_secret=th8J06DPWj1Kd4BVU4jH&redirect_uri='+cbot.service.get_host()+'api/auth&code='+req.param('code'), function(error, response, body){
			if(!error){
				var info = JSON.parse(body)
				res.cookie('access_token', info.access_token)
				res.cookie('user_id', info.user_id)
				res.end('<script>window.location.replace("/dashboard.html");</script>')
			} else{
				res.end("Не удалось идентифицировать Вас")
			}
		});
		resolve(1)
	})
}