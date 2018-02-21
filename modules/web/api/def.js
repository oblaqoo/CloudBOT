module.exports = function(req, res){
	res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
	return res.end(JSON.stringify({error: "Неизвестный метод!"}));
}