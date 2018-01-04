var cmd = {
	aliases: ["шар","ball"],
	msg:function(cbot,vk,msg,body,tbody,obody){ //cbot = CloudBOT interface; vk = vk promise interface; msg = msg object; body = тело сообщения; tbody = вызванный aliase команды; cbody = тело сообщения без aliase
		var cygan_ru = [
				'Бесспорно',
				'Предрешено',
				'Никаких сомнений',
				'Определённо, да',
				'Можешь быть уверен в этом',
				'Мне кажется — «да»',
				'Вероятнее всего',
				'Хорошие перспективы',
				'Знаки говорят — «да»',
				'Да',
				'Пока не ясно, попробуй снова',
				'Спроси позже',
				'Лучше не рассказывать',
				'Сейчас нельзя предсказать',
				'Сконцентрируйся и спроси опять',
				'Даже не думай',
				'Мой ответ — «нет»',
				'По моим данным — «нет»',
				'Перспективы не очень хорошие',
				'Весьма сомнительно'
		];
		var cygan_en = [
				'It is certain',
				'It is decidedly so',
				'Without a doubt',
				'Yes — definitely',
				'You may rely on it',
				'As I see it, yes',
				'Most likely',
				'Outlook good',
				'Signs point to yes',
				'Yes',
				'Reply hazy, try again',
				'Ask again later',
				'Better not tell you now',
				'Cannot predict now',
				'Concentrate and ask again',
				'Don’t count on it',
				'My reply is no',
				'My sources say no',
				'Outlook not so good',
				'Very doubtful '
		];
		var cygan = (tbody=='ball'?cygan_en:cygan_ru);
		msg.reply((tbody=='ball'?'[Magic 8 ball] ':'[Шар Судьбы] ')+cygan[Math.floor(Math.random() * cygan.length)]);
	},
}

module.exports = cmd;