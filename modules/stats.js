var ths = {
	isExit:function(a,b){
		if(!a)return false;
		if(!b)return true;
		if(typeof b == "string")b = b.split(".");
		for(var i in b){
			if(b.hasOwnProperty(i)){
				a = a[b[i]];
				if(!a)return false;
			}
		}
		return true;
	},
	toDate:function(m){
		var d = new Date((m.date || m) * 1000);
		return d.getFullYear() + "-" + ("00"+(d.getMonth() + 1)).substr(-2) + "-" + ("00"+d.getDate()).substr(-2);
	},
	msg:{
		'top':{
			aliases: ["top","топ"],
			description: "Статистика диалога:\n\ntop - общая статистика диалога\ntop active - самые активные участники беседы\ntop users - самые активные участники беседы, включая вышедших\ntop days - самые активные дни\ntop spies - топ шпионов\ntop spies remove - удалить из беседы шпионов", //описание функции
			go:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
				var mgs = msg.send('Идёт загрузка сообщений...'),
					count = {words:0,stickers:0,attachments: 0,photos: 0,videos: 0,audios: 0,docs: 0, walls: 0,wall_replys: 0,maps: 0,forwarded: 0,censored: 0,welcomes: 0,comings: 0,abuses: 0},
					stat = {words:{},users:{},actions:{},stickers:{},dates:{}},
					msgs = {censored:[],abuses:[],comings:[],photos:[]},
					d = new Date(),
					ignore = ['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now','и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с', 'со', 'как', 'а', 'то', 'все', 'она', 'так', 'его', 'но', 'да', 'ты', 'к', 'у', 'же', 'вы', 'за', 'бы', 'по', 'только', 'ее', 'мне', 'было', 'вот', 'от', 'меня', 'еще', 'нет', 'о', 'из', 'ему', 'теперь', 'когда', 'даже', 'ну', 'вдруг', 'ли', 'если', 'уже', 'или', 'ни', 'быть', 'был', 'него', 'до', 'вас', 'нибудь', 'опять', 'уж', 'вам', 'ведь', 'там', 'потом', 'себя', 'ничего', 'ей', 'может', 'они', 'тут', 'где', 'есть', 'надо', 'ней', 'для', 'мы', 'тебя', 'их', 'чем', 'была', 'сам', 'чтоб', 'без', 'будто', 'чего', 'раз', 'тоже', 'себе', 'под', 'будет', 'ж', 'тогда', 'кто', 'этот', 'того', 'потому', 'этого', 'какой', 'совсем', 'ним', 'здесь', 'этом', 'один', 'почти', 'мой', 'тем', 'чтобы', 'нее', 'сейчас', 'были', 'куда', 'зачем', 'всех', 'никогда', 'можно', 'при', 'наконец', 'два', 'об', 'другой', 'хоть', 'после', 'над', 'больше', 'тот', 'через', 'эти', 'нас', 'про', 'всего', 'них', 'какая', 'много', 'разве', 'три', 'эту', 'моя', 'впрочем', 'хорошо', 'свою', 'этой', 'перед', 'иногда', 'лучше', 'чуть', 'том', 'нельзя', 'такой', 'им', 'более', 'всегда', 'конечно', 'всю', 'между'],
					msg_filter = /(\s|^)((д(е|и)+б(и+л)?|д(о|а)+лб(о|а)+е+б|(ху|на+ху+)+(е|и|й)+((с(о|а)+с)|ло)?|у?еб(ла+(н|сос)|ок)|му+да+к|п(и|е)+д(о+)?р(ила+)?|даун.+|с(у+|у+ч)ка+?)|чмо+(шни+к)?)($|\s)/i;
				mgs.then(function(mg){
					vk.messages.search({
						peer_id: msg.chat_id?2000000000+msg.chat_id:msg.user_id,
						date: '01'+cbot.utils.addZero(d.getMonth()+1)+d.getFullYear(),
						count: 1
					}).then(function(data){
						var msgss = (data.items[0]?vk.getAll("messages.getHistory",{peer_id: (msg.chat_id?2000000000+msg.chat_id:msg.user_id), count: 200, start_message_id: data.items[0].id},function(progress){mgs.edit("Загружено: "+ progress.offset + " из " +progress.count);}):vk.getAll("messages.getHistory",{peer_id: (msg.chat_id?2000000000+msg.chat_id:msg.user_id), count: 200},function(progress){mgs.edit("Идёт обработка сообщений\n\nЗагружено: "+ progress.offset + " из " +progress.count);}));
						msgss.then(function(res){
							mgs.edit("Загружено сообщений: "+res.length+"\n\nОбработка сообщений...");
							var i = 0;
							mgs.edit("Готово!");
							switch(obody){
								case 'users':
								case 'people':
								case 'peoples':
									var statusers = "";
									var users = {};
									var uservk = "";
									for(i = 0; i < res.length; i++){
										var m = res[i];
										stat.users[m.from_id] = stat.users[m.from_id]?(stat.users[m.from_id]+1):1;
									}
									var sortable = [];
									for(var user in stat.users){
										sortable.push([user, stat.users[user]]);
									}
									sortable.sort(function(a, b){
										return b[1] - a[1];
									});
									for(var i = 0; i < sortable.length; i++){
										if(!sortable[i]) break;
										uservk+=sortable[i][0]+",";
									}
									vk.users.get({
										user_ids: uservk
									}).then(function(dd){
										for(var i = 0; i < dd.length; i++){
											u = dd[i]
											users[u.id] = u.first_name+' '+u.last_name;
										}
										if(sortable[0])
											for(var i = 0; i < sortable.length; i++){
												if(!sortable[i]) break;
												statusers+=(i+1)+". [id"+sortable[i][0]+"|"+users[sortable[i][0]]+"]: "+sortable[i][1]+" сообщений\n";
											}
										else
											statusers = "Соррри, это диалог с нулевой активностью :(";
										msg.send("Топ пользователей:\n\n"+statusers);
									});
									break;
								case 'active':
									var statusers = ""
									var users = {}
									var uservk = ""
									msg.getChatUsers().then(function(chat_users){
										for(i = 0; i < res.length; i++){
											var m = res[i];
											stat.users[m.from_id] = stat.users[m.from_id]?(stat.users[m.from_id]+1):1;
										}
										var sortable = [];
										for(var user in stat.users){
											if(cbot.utils.array_find(chat_users,user)+1) sortable.push([user, stat.users[user]]);
										}
										sortable.sort(function(a, b){
											return b[1] - a[1];
										});
										for(var i = 0; i < sortable.length; i++){
											if(!sortable[i]) break;
											uservk+=sortable[i][0]+",";
										}
										vk.users.get({
											user_ids: uservk
										}).then(function(dd){
											for(var i = 0; i < dd.length; i++){
												u = dd[i]
												users[u.id] = u.first_name+' '+u.last_name;
											}
											if(sortable[0])
												for(var i = 0; i < sortable.length; i++){
													if(!sortable[i]) break;
													statusers+=(i+1)+". [id"+sortable[i][0]+"|"+users[sortable[i][0]]+"]: "+sortable[i][1]+" сообщений\n";
												}
											else
												statusers = "Соррри, это диалог с нулевой активностью :(";
											msg.send("Топ пользователей:\n\n"+statusers);
										})
									})
									break;
								case 'spies':
									var statusers = ""
									var users = {}
									var uservk = ""
									msg.getChatUsers().then(function(chat_users){
										for(i = 0; i < res.length; i++){
											var m = res[i];
											stat.users[m.from_id] = stat.users[m.from_id]?(stat.users[m.from_id]+1):1;
										}
										var sortable = [];
										for(var i = 0; i < chat_users.length; i++){
											if(!stat.users[chat_users[i]]) sortable.push(chat_users[i]);
										}
										for(var i = 0; i < sortable.length; i++){
											if(!sortable[i]) break;
											uservk+=sortable[i]+",";
										}
										vk.users.get({
											user_ids: uservk
										}).then(function(dd){
											for(var i = 0; i < dd.length; i++){
												u = dd[i]
												users[u.id] = u.first_name+' '+u.last_name;
											}
											if(sortable[0])
												for(var i = 0; i < sortable.length; i++){
													if(!sortable[i]) break;
													statusers+=(i+1)+". [id"+sortable[i]+"|"+users[sortable[i]]+"]: 0 сообщений\n";
												}
											else
												statusers = "Соррри, это диалог с `ООООООООООЧЕНЬ ЖОСКА` активностью :(";
											msg.send("Топ шпионов:\n\n"+statusers);
										})
									})
									break;
								case 'spies remove':
									var statusers = ""
									var users = {}
									var uservk = ""
									msg.getChatUsers().then(function(chat_users){
										for(i = 0; i < res.length; i++){
											var m = res[i];
											stat.users[m.from_id] = stat.users[m.from_id]?(stat.users[m.from_id]+1):1;
										}
										var sortable = [];
										msg.send("Постановление Политбюро ЦК ВКП(б)\n\nИзменщиков родины приговорить к расстрелу. Приговор привести в исполнение немедленно!")
										for(var i = 0; i < chat_users.length; i++){
											if(!stat.users[chat_users[i]]) msg.removeChatUser(chat_users[i])
										}
									})
									break;
								case 'days':
									var statdays = "";
									for(i = 0; i < res.length; i++){
										var m = res[i];
										stat.dates[ths.toDate(m)] = stat.dates[ths.toDate(m)]?(stat.dates[ths.toDate(m)]+1):1;
									}
									var sortable = [];
									for(var day in stat.dates){
										sortable.push([day, stat.dates[day]]);
									}
									sortable.sort(function(a, b){
										return b[1] - a[1];
									});
									if(sortable[0])
										for(var i = 0; i < 30; i++){
											if(!sortable[i]) break;
											statdays+=sortable[i][0]+": "+sortable[i][1]+" сообщений\n";
										}
									else
										statdays = "Соррри, это диалог с нулевой активностью :(";
									msg.send("Топ 30 дней:\n\n"+statdays);
									break;
								default:
									for(i = 0; i < res.length; i++){
										var m = res[i];
										if(m.attachments){
											count.attachments += m.attachments.length;
											m.attachments.forEach(function(l){
												count[l.type + "s"]++;
												
												if(l.type == "photo"){
													msgs[l.type + "s"].push("<a target='_blank' href='"+(l.photo.photo_1280 || l.photo.photo_807 || l.photo.photo_604 || l.photo.photo_75)+"'><img src='"+l.photo.photo_75+"' title='"+JSON.stringify(m)+"'/></a>");
												}
											});
										}
										if(m.geo)
											count.maps++;
										if(m.fwd_messages)
											count.forwarded += m.fwd_messages.length;
										if(/(прив(ет)?|зда?р(а|о)в(ствуй(те)?)?|hi|hello|qq|добр(ый|ой|ого|ое)\s(день|ночи|вечер|утро))/i.test(m.body))
											count.welcomes++;
										if(/(пока|до\s?св(и|е)дания|спок(ойной ночи|и)?|пэздуй с мопэда|до (завтр(а|о)|встречи))/i.test(m.body))
											count.comings++;
										if(msg_filter.test(m.body)){
											count.abuses++;
											msgs.abuses.push(m.from_id+": "+m.body+"<hr>");
										}
										if(ths.isExit(m,"attachments.0.sticker")){
											count.stickers++;
											m.sticker_id = m.attachments[0].sticker.id;
											stat.stickers[m.sticker_id] = stat.stickers[m.sticker_id]?(stat.stickers[m.sticker_id]+1):1;
										}
										if(!m.body)continue;
										m.body.replace(/[\(\)\[\]\{\}<>\s,.:;'\"_\/\\\|\?\*\+!@#$%\^=\~—¯_-]+/igm, " ").replace(/\s{2,}/gm, "").split(" ").forEach(function(word){
											word = word.trim().toLowerCase();
											//word = new Stem("russian")(word);
											count.words++;
											
											if (msg_filter.test(word)){
											count.censored++;
											msgs.censored.push(word+", ");
											}
											
											if (!word || ~ignore.indexOf(word) || ! /^.{2,25}$/i.test(word)) return;
											stat.words[word] = stat.words[word] ? stat.words[word] + 1 : 1;
										});
									}
									msg.send("Статистика диалога:\n\nВсего сообщений: "+i+"\nКарт: "+count.maps+"\nПересланных сообщений: "+count.forwarded+"\nПриветствий: "+count.welcomes+"\nПрощаний: "+count.comings+"\nОскорблений: "+count.abuses+"\nПрикреплений: "+count.attachments+"\nФотографий: "+count.photos+"\nАудиозаписей: "+count.audios+"\nВидеозаписей: "+count.videos+"\nДокументов: "+count.docs+"\nПостов: "+count.walls+"\nСтикеров: "+count.stickers+"\nСлов: "+count.words+" (Нецензурных: "+count.censored+")");
									break;
							}
						}, console.error);
					});
				});
			},
		}
	},
	sign:{
		issuer: 1,
		version: 0.1,
		trust_key: 'b33a5b1a774990834b484332b37b7487',
	},
};

module.exports = ths;