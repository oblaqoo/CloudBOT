function Message(data) {
    if (this.constructor != Message) {
      throw Error('Message was called without "new" operator');
    }

    Object.assign(this, data);

    if (!this.peer_id) this.peer_id = this.chat_id ? 2e9 + this.chat_id : this.user_id;
    if (!this.from_id && !this.user_id) this.from_id = this.user_id;
    if (!this.body && this.text) this.body = this.text;

    this.bindContext();

    return this;
}

Message.prototype.bindContext = function bindContext() {
    for (let f of Object.getOwnPropertyNames(this.constructor.prototype)) {
        if (typeof this[f] == 'function') {
            this[f] = this[f].bind(this);
        }
    }
}

Message.parseLongPoll = function parseLongPoll(data) {
    if (data[0] !== 4) return false;
    var msg = {
        id: data[1],
        out: Boolean(data[2] & 2),
        longpoll: 1,
        title: data[5],
        date: data[4],
        body: data[6]
            .replace(/<br>/g, '\n')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&'),
        peer_id: Number(data[3]),
        from_id: Number(data[7].from || data[3]),
        user_id: Number(data[7].from || data[3]),
        data: data
    };

    if (data[7] && data[7]['attach0']) {
        msg.attachments = [];
        var i = 0;

        while (i++ < 10 && data[7]['attach' + i]) {
            msg.attachments.push(
                data[7]['attach' + i + '_type'] +
                data[7]['attach' + i]
            );
        }

        if (data[7].attach1_type == 'sticker') {
            msg.sticker_id = data[7].attach1;
        }
    }

    if (data[7].fwd) msg.fwd = data[7].fwd;
    if (data[7].emoji) msg.emoji = data[7].emoji;
    if (data[7].from_admin) msg.from_admin = data[7].from_admin;
    if (data[7].source_act) msg.action = data[7].source_act;
    if (data[7].source_mid) msg.action_mid = data[7].source_mid;
    if (data[7].source_text) msg.action_text = data[7].source_text;
    if (data[7].source_old_text) msg.action_old_text = data[7].source_old_text;

    if (msg.peer_id > 2e9) msg.chat_id = msg.peer_id - 2e9;

    return msg;
}

Message.prototype.get = function get() {
    return this.vk.messages.getById({
        message_ids: this.id
    }).then(function onResponse(message) {
        if (!message.items || !message.items.length) {
            throw message;
        }

        Object.assign(this, message.items[0]);
        delete this.longpoll;
        return this;
    });
}

Message.prototype.send = function send(message, data) {
    var self = this;
    var responsePromise = this.vk.messages.send(Object.assign({
        peer_id: this.peer_id,
        message: typeof message !== 'undefined' ? message.toString() : ''
    }, data));

    responsePromise.edit = function editMessage(editMessage, editData) {
        return responsePromise.then(function onSendResponse(message_id) {
            return self.vk.messages.edit(Object.assign({
                peer_id: self.peer_id,
                message_id: message_id,
                message: editMessage
            }, editData));
        });
    };

    responsePromise.pin = function pinMessage() {
        return responsePromise.then(function onPinResponse(message_id) {
            return self.vk('messages.pin', {
                peer_id: self.peer_id,
                message_id: message_id
            });
        }).catch(console.error);
    };

    return responsePromise;
}

Message.prototype.reply = function reply(message, data) {
    return this.send(message, Object.assign({
        forward_messages: this.id
    }, data));
}

Message.prototype.sendKeyboard = function sendKeyboard(message, buttons, one_time, data){
    if(this.keyboard) return this.send(message, Object.assign({
		keyboard: JSON.stringify({ 
			one_time: one_time || true, 
			"buttons": buttons || [ 
				[{ 
					"action": { 
					"type": "text", 
					"payload": "{\"button\": \"1\"}", 
					"label": "Помощь" 
					}, 
					"color": "default" 
				}]
			]
		})
	}, data));
	else return this.send(message, data);
}

Message.prototype.sendAttachment = function sendAttachment(attachment, message, data) {
    return this.send(message, Object.assign({
        attachment: attachment
    }, data));
}

Message.prototype.sendPhoto = function sendPhoto(photo, message, data) {
    var self = this;

    return this.vk.upload.messagesPhoto({
        files: { photo }
    }).then(function onPhotoUpload(attachment) {
        return self.vk.VK.parseAttachments(attachment, 'photo');
    }).then(function onPhotoParse(attachment) {
        return self.sendAttachment(attachment, message, data);
    });
}

Message.prototype.sendDoc = function sendDoc(file, message, data, get) {
    var self = this;

    return this.vk.upload.docs({
        get: get,
        files: { file: file }
    }).then(function onPhotoUpload(attachment) {
        return self.vk.VK.parseAttachments(attachment, 'doc');
    }).then(function onPhotoParse(attachment) {
        return self.sendAttachment(attachment, message, data);
    });
}

Message.prototype.sendGraffiti = function sendGraffiti(file, message, data) {
    return this.sendDoc(file, message, data, { type: 'graffiti' });
}

Message.prototype.sendAudioMessage = function sendAudioMessage(file, message, data) {
    return this.sendDoc(file, message, data, { type: 'audio_message' });
}

Message.prototype.setActivity = function setActivity(type) {
    return this.vk.messages.setActivity({
        peer_id: this.peer_id,
        type: type || 'typing'
    });
}

Message.prototype.deleteDialog = function deleteDialog() {
    return this.vk.messages.deleteDialog({
        peer_id: this.peer_id
    });
}

Message.prototype.delete = function deleteMessage(data) {
    if (data == 1) {
        data = { spam: data };
    }

    return this.vk.messages.delete(Object.assign({
        message_ids: this.id
    }, data));
}

Message.prototype.restore = function restore() {
    return this.vk.messages.restore({
        message_id: this.id
    });
}

Message.prototype.markAsRead = function markAsRead() {
    return this.vk.messages.markAsRead({
        peer_id: this.peer_id
    });
}

Message.prototype.markAsImportant = function markAsImportant(important) {
    return this.vk.messages.markAsImportant({
        message_ids: this.id,
        important: important
    });
}

Message.prototype.markAsImportantDialog = function markAsImportantDialog(important) {
    return this.vk.messages.markAsImportantDialog({
        peer_id: this.peer_id,
        important: important
    });
}

Message.prototype.markAsAnsweredDialog = function markAsAnsweredDialog() {
    return this.vk.messages.markAsAnsweredDialog({
        peer_id: this.peer_id
    });
}

Message.prototype.chatMethod = function chatMethod(method, data) {
    if (!this.chat_id) {
        return Promise.reject('Only chat function');
    }

    return this.vk(method, Object.assign({
        chat_id: this.chat_id,
        peer_id: this.peer_id
    }, data));
}

Message.prototype.getChat = function getChat(data) {
    return this.chatMethod('messages.getChat', data);
}

Message.prototype.pin = function pin(message_id) {
    return this.chatMethod('messages.pin', {
        message_id: message_id || this.id
    });
}

Message.prototype.addChatUser = function addChatUser(user_id) {
    return this.chatMethod('messages.addChatUser', {
        user_id: user_id
    });
}

Message.prototype.removeChatUser = function removeChatUser(user_id) {
    return this.chatMethod('messages.removeChatUser', {
        member_id: user_id,
		v:"5.81"
    });
}

Message.prototype.unpin = function unpin(data) {
    return this.chatMethod('messages.unpin', data);
}

Message.prototype.getInviteLink = function getInviteLink(reset) {
    return this.chatMethod('messages.getInviteLink', {
        reset: reset
    });
}

Message.prototype.getChatUsers = function getChatUsers(data) {
    return this.chatMethod('messages.getChatUsers', data);
}

Message.prototype.getConversationMembers = function getConversationMembers(data) {
    if(!data) data = {}
	data.v = "5.80"
	return this.chatMethod("messages.getConversationMembers", data);
}

Message.prototype.editChat = function editChat(title, data) {
    data = Object.assign({
        title: title
    }, data);
    return this.chatMethod('messages.editChat', data);
}

if (typeof module !== 'undefined') {
    module.exports = Message;
}
