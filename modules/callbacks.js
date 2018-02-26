module.exports = {
	load:function(cb, cbot){
		this.cbot = cbot
		this.cb = cb		
		return console.log("Callbacks ready!")
	},
	get:function(msg){
		var mdl = this
		return new Promise(function(resolve, reject){
			mdl.cb.on("mwa",function(nmsg){
				if(nmsg.user_id == msg.user_id && nmsg.chat_id == msg.chat_id && !nmsg.out && !nmsg.action){
					mdl.cbot.service.ignore[nmsg.id] = 1
					resolve(nmsg)
				}
			})
		})
	},
	getall:function(msg){
		var mdl = this
		return new Promise(function(resolve, reject){
			mdl.cb.on("mwa",function(nmsg){
				if(!nmsg.out && !nmsg.action && ((nmsg.user_id == msg.user_id && nmsg.chat_id == msg.chat_id) || nmsg.chat_id == msg.chat_id)){
					mdl.cbot.service.ignore[nmsg.id] = 1
					resolve(nmsg)
				}
			})
		})
	},
}