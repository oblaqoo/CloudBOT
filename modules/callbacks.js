module.exports = {
	load:function(cb){
		console.log("Callbacks ready!")
		return this.cb = cb
	},
	get:function(msg){
		var mdl = this
		return new Promise(function(resolve, reject){
			mdl.cb.on("mwa",function(nmsg){
				if(nmsg.user_id == msg.user_id && nmsg.chat_id == msg.chat_id && !nmsg.out) resolve(nmsg)
			})
		})
	},
	getall:function(msg){
		var mdl = this
		return new Promise(function(resolve, reject){
			mdl.cb.on("mwa",function(nmsg){
				if(!nmsg.out && ((nmsg.user_id == msg.user_id && nmsg.chat_id == msg.chat_id) || nmsg.chat_id == msg.chat_id)) resolve(nmsg)
			})
		})
	},
}