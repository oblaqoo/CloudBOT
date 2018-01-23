var mdl = {
	add_all:function(vk){
		vk.friends.getRequests({
			need_viewed: 1,
			out: 0,
			count: 484
		}).then(function(data){
			for(var i=0;i<data.items.length;i++){
				console.log('[AutoFriends] New friend: '+data.items[i]);
				vk.friends.add({
					user_id: data.items[i]
				});
			}
		});
	},
	remove_all:function(vk){
		vk.friends.getRequests({
			need_viewed: 1,
			out: 1,
			count: 484
		}).then(function(data){
			for(var i=0;i<data.items.length;i++){
				console.log('[AutoFriends] Friend deleted: '+data.items[i]);
				vk.account.banUser({
					user_id: data.items[i]
				});
			}
		});
	},
	load:function(cbot,vk,cb){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения
		if(cbot.config.callback.group) return;
		this.add_all(vk);
		this.remove_all(vk);
		setInterval(function(){
			mdl.add_all(vk);
			mdl.remove_all(vk);
		}, 30000);
		console.log('AutoFriends by oblaqoo successfully loaded!');
	},
	sign:{
		issuer: 1,
		version: 0.1,
		trust_key: '0c5b1476d0cfaf0618e859bcb3897fed',
	},
}

module.exports = mdl;