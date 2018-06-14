/* 
	Module by flyink13
	Modified by oblaqoo
*/

var https = require('https'),
    url = require('url'),
    querystring = require('querystring'),
    stream = require('stream');


class Message {
    constructor(msg) {
        Object.assign(this, msg);
        if (!this.peer_id) this.peer_id = this.chat_id ? 2e9 + this.chat_id : this.user_id;
        if (!this.from_id) this.from_id = this.user_id;

        for (let f of Object.getOwnPropertyNames(this.constructor.prototype))
            if(typeof this[f] == "function")
                this[f] = this[f].bind(this);
    }
    static parseLongPoll(data){
        if (data[0] !== 4) return false;
        var msg = {
            id: data[1],
            out: Boolean(data[2] & 2),
            longpoll: 1,
            title: data[5],
            date: data[4],
            body: data[6]
                .replace(/<br>/g, "\n")
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&'),
            peer_id: Number(data[3]),
            from_id: Number(data[7].from || data[3]),
            user_id: Number(data[7].from || data[3]),
            data: data
        };

        if (data[2] & 512) {
            msg.attachments = [];
            var i = 0;

            while (i++ < 10 && data[7]["attach" + i]) {
                msg.attachments.push(
                    data[7]["attach" + i + "_type"] +
                    data[7]["attach" + i]
                );
            }

            if (data[7].attach1_type == "sticker")
                msg.sticker_id = data[7].attach1;
        }

        if (data[7].fwd) msg.fwd = data[7].fwd;
        if (data[7].emoji) msg.emoji = data[7].emoji;
        if (data[7].from_admin) msg.from_admin = data[7].from_admin;
        if (data[7].source_act) msg.action = data[7].source_act;
        if (data[7].source_mid) msg.action_mid = data[7].source_mid;
        if(data[7].source_text) msg.action_text = data[7].source_text;
        if(data[7].source_old_text) msg.action_old_text = data[7].source_old_text;

        if(msg.peer_id > 2e9) msg.chat_id = msg.peer_id - 2e9;

        return msg;
    }
    get(){
        return this.vk.messages.getById({
            message_ids: this.id
        }).then(message => {
            if (!message.items || !message.items.length) throw message;
            Object.assign(this, message.items[0]);
            delete this.longpoll;
            return this;
        });
    }
    loadUsers(){
        return Promise.reject("В разработке...");
        var ids = [this.user_id, this.from_id, this.admin_id, this.action_mid];
        if(!this.longpoll && this.fwd_messages)
            for(var i = 0; i < this.fwd_messages.length; i++)
                ids.push(this.fwd_messages[i].user_id);
        this.send(ids.join(","));
    }
    send(message, data){
        var r = this.vk.messages.send(Object.assign({
            peer_id: this.peer_id,
            message: typeof message !== "undefined" ? message.toString() : ""
        }, data));
        r.edit = (message, data) =>
            r.then(message_id => {
                return this.vk.messages.edit(Object.assign({
                    peer_id: this.peer_id,
                    message_id,
                    message
                }, data));
            });
        r.pin = () =>
            r.then(message_id => {
                return this.vk("messages.pin", {
                    peer_id: this.peer_id,
                    message_id
                });
            }).catch(console.error);
        return r;
    }
    reply(message, data){
        return this.send(message, Object.assign({
            forward_messages: this.id
        }, data));
    }
    sendKeyboard(message, buttons, one_time, data){
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
    sendAttachment(attachment, message, data){
        return this.send(message, Object.assign({attachment}, data));
    }
    sendPhoto(photo, message, data){
        return this.vk.upload.messagesPhoto({ files: { photo } })
            .then(attachment => VK.parseAttachments(attachment, "photo"))
            .then(attachment => this.sendAttachment(attachment, message, data));
    }
    sendDoc(file, message, data, get){
        return this.vk.upload.docs({ get, files: { file } })
            .then(attachment => VK.parseAttachments(attachment, "doc"))
            .then(attachment => this.sendAttachment(attachment, message, data));
    }
    sendGraffiti(file, message, data){
        return this.sendDoc(file, message, data, {type: "graffiti"});
    }
    sendAudioMessage(file, message, data){
        return this.sendDoc(file, message, data, {type: "audio_message"});
    }
    setActivity(type){
        return this.vk.messages.setActivity({
            peer_id: this.peer_id,
            type: type || "typing"
        });
    }
    deleteDialog(){
        return this.vk.messages.deleteDialog({
            peer_id: this.peer_id
        });
    }
    delete(spam){
        return this.vk.messages.delete({
            message_ids: this.id, spam
        });
    }
    restore(){
        return this.vk.messages.restore({
            message_id: this.id
        });
    }
    markAsRead(){
        return this.vk.messages.markAsRead({
            peer_id: this.peer_id
        });
    }
    markAsImportant(important){
        return this.vk.messages.markAsImportant({
            message_ids: this.id, important
        });
    }
    markAsImportantDialog(important){
        return this.vk.messages.markAsImportantDialog({
            peer_id: this.peer_id, important
        });
    }
    markAsAnsweredDialog(){
        return this.vk.messages.markAsAnsweredDialog({
            peer_id: this.peer_id
        });
    }
    chatMethod(method, data){
        if(!this.chat_id) return Promise.reject("Only chat function");
        return this.vk(method, Object.assign({
            chat_id: this.chat_id,
            peer_id: this.peer_id
        }, data));
    }
    getChat(data){
        return this.chatMethod("messages.getChat", data);
    }
    pin(){
        return this.chatMethod("messages.pin", {message_id: this.id});
    }
    addChatUser(user_id){
        return this.chatMethod("messages.addChatUser", {user_id});
    }
    removeChatUser(user_id){
        return this.chatMethod("messages.removeChatUser", {user_id});
    }
    unpin(data){
        return this.chatMethod("messages.unpin", {});
    }
    getInviteLink(reset){
        return this.chatMethod("messages.getInviteLink", {reset});
    }
    getChatUsers(data){
        return this.chatMethod("messages.getChatUsers", data);
    }
    editChat(title, data){
        data = Object.assign({title}, data);
        return this.chatMethod("messages.editChat", data);
    }
}

function VK(access_token, options) {

    options = Object.assign({}, VK.default_options, options);

    // Секция отвечающая за запросы
    function request(_options, data) {
        return new Promise(function(resolve, reject) {
            if (typeof _options == "string") _options = Object.assign({
                method: "GET"
            }, url.parse(_options, true, false));
            if (_options.method == "GET") {
                _options.query = Object.assign({}, _options.query, data);
                _options.search = "?" + querystring.stringify(_options.query);
                _options.path = _options.pathname + _options.search;
            }
            _options = Object.assign({}, options, _options);
            var req = https.request(_options, function(res) {
                var buffers = [];
                req.setTimeout(options.timeout);
                res.on("data", c => buffers.push(c));
                res.on("end", function() {
                    if (res.statusCode !== 200)
                        return reject({
                            res: res,
                            req: req,
                            body: Buffer.concat(buffers),
                            statusCode: res.statusCode
                        });
                    res = req = data = undefined;
                    resolve(Buffer.concat(buffers));
                });
                res.on("error", reject);
            }).on("error", reject);
            if (_options.method == "GET") {
                req.end();
            } else if (typeof data === 'object' && typeof data.pipe === 'function') {
                data.pipe(req);
            } else {
                req.end(data);
            }
        }).catch(function(error) {
            if ((error.statusCode == 302 || error.statusCode == 301) && error.res.headers.location){
                return request(Object.assign(_options, url.parse(error.res.headers.location)), data);
            }
            throw {
                error: {
                    error_code: error.statusCode || -1,
                    error_msg: "I/O Error",
                    _options,
                    error: error
                }
            };
        });
    }

    function tryJSON(body) {
        return new Promise(function(resolve, reject) {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject({
                    error: {
                        error_code: -2,
                        error_msg: "Parse Error",
                        error: error,
                        body: body
                    }
                });
            }
        });
    }

    function vk(method, data, additional_data) {
        data = Object.assign({headers: options.headers}, options.body, data, additional_data);

        if (!data.ignore_cart && vk.cart.timer !== false)
            return new Promise(function(resolve, reject) {
                delete data.headers;
                vk.cart.list.push({
                    method: method,
                    data: data,
                    resolve: resolve,
                    reject: reject
                });
            });

        delete data.ignore_cart;
        if (vk.cart.timer === false) vk.cart.init();

        data.access_token = data.access_token || access_token;

        var headers = Object.assign({}, data.headers);
        delete data.headers;

        vk.on("request", {method, headers, data});

        return request({
                path: "/method/" + method,
                headers: headers
            }, querystring.stringify(data))
            .then(tryJSON)
            .then(function(body) {
                if (body.error) throw body.error;
                vk.on("response", body.response, {
                    method: method
                });
                return method == "execute" ? body : body.response;
            })
            .catch(function(error) {
                if (error.error_code == 6 && data.retry !== false)
                    return new Promise(function(resolve, reject) {
                        if (vk.cart.timer === false) vk.cart.init();
                        vk.cart.list.unshift({
                            method: method,
                            data: data,
                            resolve: resolve,
                            reject: reject
                        });
                    });
                if (error.error_code == 14 && data.reject_captcha !== true)
                    return new Promise(function(resolve, reject) {
                        vk.on("captcha", {
                            captcha_img: error.captcha_img,
                            method: method,
                            data: data,
                            error: error,
                            submit: function(captcha_key) {
                                vk(method, Object.assign(data, {
                                    captcha_sid: error.captcha_sid,
                                    captcha_key: captcha_key
                                })).then(resolve, reject);
                            }
                        });
                    });
                vk.on("error", {
                    error: error,
                    method: method,
                    data: data,
                    retry: vk.bind(this, method, data)
                });
                throw {
                    error: error,
                    method: method,
                    data: data,
                    retry: vk.bind(this, method, data)
                };
            });
    }

    // Создаем секции и фунции методов
    VK.available_methods.map(function(method) {
        if (method.indexOf(".") == -1) {
            vk[method] = vk.bind(this, method);
        } else {
            method = method.split(".");
            if (!vk[method[0]])
                vk[method[0]] = {};
            vk[method[0]][method[1]] = vk.bind(this, method.join("."));
        }
    });

    // Секция отвечающая за события
    vk.listeners = {
        "*": []
    };

    vk.on = function(_event, data, add_to_event) {
        if (!vk.listeners[_event])
            vk.listeners[_event] = [];
        if (typeof data == "function") {
            vk.listeners[_event].push(data);
        } else {
            vk.listeners[_event].concat(vk.listeners["*"])
                .map(function(_function) {
                    if (typeof _function == "function")
                        _function(Object.assign({
                            data: data,
                            eventName: _event
                        }, add_to_event), data);
                });
        }
        return data;
    };

    // Секция отвечающая за сообщения

    vk.longpoll = {
        exit: false,
        started: false,
        stop: function (callback) {
            return new Promise(function(resolve, reject) {
                vk.longpoll.exit = function (data) {
                    resolve(data);
                    if(callback) callback(data);
                };
                if(!vk.longpoll.started){
                    vk.longpoll.exit({error: "stoped"});
                    return;
                }
            });
        },
        start: function(opts) {
            vk.longpoll.started = true;
            vk("messages.getLongPollServer", {
                use_ssl: 1,
                need_pts: 1
            }).then(function (data) {
                return vk.longpoll.listen(Object.assign(data, options.longpoll, opts));
            });
            return vk;
        },
        listen: function (data) {
            if (!data.server) throw {error: "Invalid server", data};
            vk.on("LongPollRequest", data);
            return request("https://" + data.server + "?" + querystring.stringify(data))
                .then(tryJSON)
                .then(function(body) {
                    vk.on("LongPollResponse", body);
                    if (body.error || body.failed) {
                        throw body;
                    } else if (body.updates) {
                        body.updates.map(vk.on.bind(this, "update"));
                        data.ts = body.ts;
                    }
                    if(vk.longpoll.exit) throw data;
                    return vk.longpoll.listen(data);
                }).catch(function(e) {
                    if(vk.longpoll.exit){
                        if(typeof vk.longpoll.exit == "function") vk.longpoll.exit(e);
                        vk.longpoll.exit = false;
                        vk.longpoll.started = false;
                        return vk.on("LongPollStop", e);
                    }else {
                        vk.on("LongPollError", e); 
                        //return vk.longpoll.start(options);
                    }
                });
        }
    };

    vk.init_longpoll = function (options) {
        console.warn("Warning: Function vk.init_longpoll will be removed replace with vk.longpoll.start");
        return vk.longpoll.start(options);
    };

    vk.on("update", function(event) {
        if(event.data[0] !== 4) return;
        var msg = Message.parseLongPoll(event.data);
        msg = vk.attach_message_functions(msg);
        vk.on("message", msg);
    });

    vk.attach_message_functions = function (msg) {
        msg = new Message(msg);
        Object.defineProperty(msg, "vk", {
            enumerable: false,
            get: function () {
                return vk;
            }
        });
        return msg;
    };

    // Секция отвечающая за Callback API
    vk.init_callback_api = function(key, secret, data) {
        return function(req, res) {
            if (req.method !== 'POST') return req.connection.destroy();
            var body = "";
            req.on('data', function(chunk) {
                if (body.length > 1e6) {
                    body = null;
                    req.connection.destroy();
                } else {
                    body += chunk;
                }
            });
            req.on('end', function() {
                try {
                    body = JSON.parse(body);
                    body.$ = {
                        key: key,
                        data: data,
                        req: req,
                        res: res
                    };
                } catch (e) {
                    body = null;
                    return req.connection.destroy();
                }
                if (secret && secret !== body.secret) {
                    return res.end("Invalid secret");
                } else if (body.type == "confirmation") {
                    vk.on("confirmation", body.object, {
                        reject: (description) => {body.$.key = description;}
                    });
                    return res.end(body.$.key);
                } else if (body.type == "message_reply" || body.type == "message_new") {
                    body.object.out = body.type == "message_reply";
                    body.object.$ = body.$;
                    body.object.keyboard = 1;
                    vk.on("message", vk.attach_message_functions(body.object), {
                        ok: (code) => res.end(code || "OK")
                    });
                } else {
                    vk.on(body.type, body, {
                        ok: (code) => res.end(code || "OK")
                    });
                }
            });
        };
    };

    // Секция отвечающая за очередь запросов
    vk.cart = {
        list: [],
        timer: false,
        execute: false,
        init: function(interval) {
            vk.cart.timer = setInterval(function() {
                if (!vk.cart.list.length) {
                    if (!options.disable_auto_deinit_cart) vk.cart.deinit();
                    return;
                }
                var req = vk.cart.list.shift();

                if (vk.cart.execute && vk.cart.list.length && req.method !== "execute")
                    req = vk.build_execute_request(req, vk.cart.list);

                vk(req.method, req.data, {
                    ignore_cart: true
                }).then(req.resolve, req.reject);
            }, interval || options.cart_interval);
        },
        deinit: function() {
            clearInterval(vk.cart.timer);
            vk.cart.timer = false;
        }
    };

    vk.build_execute_request = function(req, cart) {
        var reqToString = function(req){
                if(req.data.lang == options.body.lang) delete req.data.lang;
                if(req.data.v == options.body.v) delete req.data.v;
                delete req.data.reject_captcha;
                return "API." + req.method + "(" + JSON.stringify(req.data) + ")";
            },
            limit = 4000;

        if (reqToString(req).length > limit) {
            return req;
        }

        var code = "return [" + reqToString(req),
            tmp_cart = [req];


        var _req = "";

        for (var i = 0; i < cart.length; i++) {
            if (cart[i].method == "execute" || cart[i].data.ignore_execute_cart || cart[i].data.access_token) continue;
            _req = "," + reqToString(cart[i]);
            if (code.length + _req.length > limit || tmp_cart.length >= 25) break;
            code += _req;
            tmp_cart.push(cart.splice(i, 1)[0]);
            i--;
        }

        code += "];";

        return {
            method: "execute",
            data: {
                code: code
            },
            resolve: function(r) {
                if (!r.response) throw r;
                var error_index = 0;
                r.response.map(function(i, ii) {
                    if (i) {
                        return tmp_cart[ii].resolve(i);
                    } else if (r.execute_errors && r.execute_errors[error_index]) {
                        tmp_cart[ii].reject(r.execute_errors[error_index]);
                        error_index++;
                    } else {
                        return tmp_cart[ii].resolve(i);
                    }
                });
            },
            reject: function(e) {
                tmp_cart.map(i => i.reject(e));
            }
        };
    };

    vk.init_execute_cart = function(interval) {
        vk.cart.execute = true;
        vk.cart.init(interval);
    };

    // Автоматический перебор с offset
    vk.getAll = function(method, data, onstep) {
        return new Promise(function(resolve, reject) {
            var response = [];
            data = Object.assign({
                count: 100
            }, data);

            (function next(offset) {
                var max_requests = 25,
                    requests = [];

                while (max_requests--) {
                    requests.push("API." + method + "(data + {offset: " + offset + "})");
                    offset += data.count;
                }

                vk("execute", {
                    code: "var data = " + JSON.stringify(data || {}) + ";" +
                        "return [" + requests.join(",") + "];"
                }).then(function(r) {
                    if (!r.response[0].items) throw "unsuppodted method";
                    var items = r.response.reduce((pv, cv) => pv.concat(cv.items), []);
                    response = response.concat(items);
                    if (onstep) onstep({
                        offset: offset,
                        count: r.response[0].count,
                        new_items: items,
                        all_items: response
                    });
                    if (offset >= r.response[0].count || offset >= data.max_offset) {
                        return resolve(response);
                    } else {
                        next(offset);
                    }
                }).catch(reject);
            })(0);
        });
    };

    // Авторизация
    vk.auth = function(data) {
        return vk.request("https://oauth.vk.com/token", Object.assign({
                "grant_type": "password",
                "scope": "all",
                "client_id": "2274003",
                "2fa_supported": "1",
                "client_secret": "hHbZxrka2uZ6jB1inYsH"
            }, data)).then(vk.tryJSON)
            .then(function(r) {
                if (!r.access_token) throw r;
                access_token = r.access_token;
                return r;
            });
    };

    // Методы для загрузкки файлов
    vk.upload = function(get_server_method, save_method, data) {

        if (data && !data.files && (data.pipe || data.buffer) || Buffer.isBuffer(data)) {
            if (Buffer.isBuffer(data)) data = {
                buffer: data
            };
            if (/^photos\.getWall|Owner|Messages/.test(get_server_method)) {
                data = {
                    files: {
                        photo: data
                    }
                };
            } else if (get_server_method == "photos.getUploadServer") {
                data = {
                    files: {
                        file1: data
                    }
                };
            } else if (get_server_method == "video.save") {
                data = {
                    files: {
                        video_file: data
                    }
                };
            } else {
                data = {
                    files: {
                        file: data
                    }
                };
            }
        }

        if (!data || !data.files)
            Promise.reject({
                retry: vk.upload.bind(this, get_server_method, save_method, data),
                error: {
                    error_code: -400,
                    error_msg: "Нечего передавать"
                }
            });

        return vk(get_server_method, data.get || {})
            .then(function(r) {
                var boundary = (Math.random() * 1e18)
                    .toString(16) + (Math.random() * 1e18)
                    .toString(16);
                vk.on("upload.get_server", r.upload_url);
                var _options = url.parse(r.upload_url);
                _options.method = "POST";
                _options.headers = {
                    "Content-Type": 'multipart/form-data;boundary=' + boundary
                };
                var rs = new stream.PassThrough();

                var files = Object.keys(data.files);
                (function sendPart() {
                    if (!files.length) {
                        rs.push('\n--' + boundary + '--\n');
                        vk.on("upload.end", true);
                        return rs.push(null);
                    }
                    var name = files.shift();
                    var part = data.files[name];

                    if (!part.filename && !part.path && part.req && part.req.path)
                        part.filename = part.req.path.replace(/(.+)(\/|\\)/, "")
                        .replace(/\?.+$/, "");
                    if (!part.filename)
                        part.filename = part.path ? part.path.replace(/(.+)(\/|\\)/, "") : options.filename;

                    vk.on("upload.part", part);
                    rs.push('\n--' + boundary + '\nContent-Disposition: form-data; name="' + name + '"; filename="' + part.filename + '"\n\n');
                    if (part.readable) {
                        part.pipe(rs, {
                            end: false
                        });
                        part.on('end', function() {
                            vk.on("part_end", part);
                            sendPart();
                        });
                    } else if (part.buffer) {
                        rs.push(part.buffer);
                        sendPart();
                    } else {
                        console.warn("VK.upload: unsupported data type");
                        sendPart();
                    }
                })();

                return request(_options, rs);
            }).then(tryJSON)
            .then(function(body) {
                vk.on("upload.save", body);
                if (body.error) throw {
                    retry: vk.upload.bind(this, get_server_method, save_method, data),
                    error: body.error
                };
                if(save_method == "return") return body;
                return vk(save_method, Object.assign(data.save || {}, body));
            });
    };

    vk.upload.photo = vk.upload.photos = vk.upload.bind(this, "photos.getUploadServer", "photos.save");
    vk.upload.wallPhoto = vk.upload.wallPhotos = vk.upload.bind(this, "photos.getWallUploadServer", "photos.saveWallPhoto");
    vk.upload.ownerPhoto = vk.upload.bind(this, "photos.getOwnerPhotoUploadServer", "photos.save");
    vk.upload.messagesPhoto = vk.upload.bind(this, "photos.getMessagesUploadServer", "photos.saveMessagesPhoto");
    vk.upload.marketPhoto = vk.upload.bind(this, "photos.getMarketUploadServer", "photos.saveMarketPhoto");
    vk.upload.marketAlbumPhoto = vk.upload.bind(this, "photos.getMarketAlbumUploadServer", "photos.saveMarketAlbumPhoto");
    vk.upload.audio = vk.upload.bind(this, "audio.getUploadServer", "audio.save");
    vk.upload.video = vk.upload.bind(this, "video.save", "video.save");
    vk.upload.doc = vk.upload.docs = vk.upload.bind(this, "docs.getUploadServer", "docs.save");
    vk.upload.wallDoc = vk.upload.wallDocs = vk.upload.bind(this, "docs.getWallUploadServer", "docs.save");
    vk.upload.groupCover = vk.upload.bind(this, "photos.getOwnerCoverPhotoUploadServer", "photos.saveOwnerCoverPhoto");

    vk.upload.widgetsAppImage = vk.upload.bind(this, "appWidgets.getAppImageUploadServer", "appWidgets.saveAppImage");
    vk.upload.widgetsGroupImage = vk.upload.bind(this, "appWidgets.getGroupImageUploadServer", "appWidgets.saveGroupImage");

    vk.upload.storiesPhoto = vk.upload.bind(this, "stories.getPhotoUploadServer", "return");
    vk.upload.storiesVideo = vk.upload.bind(this, "stories.getVideoUploadServer", "return");
    vk.upload.chatPhoto = (options) =>
        vk.upload("photos.getChatUploadServer", "return", options)
            .then((r) => vk.messages.setChatPhoto({file: r.response}));

    return Object.assign(vk, {
        request: request,
        tryJSON: tryJSON,
        options: options,
    });
}

VK.default_options = {
    filename: "photo.png",
    cart_interval: 334,
    timeout: 120000,
    host: "api.vk.com",
    method: "POST",
    body: {
        v: "5.69"
    },
    headers: {
        'user-agent': 'VKAndroidApp/4.38-849 (Android 6.0; SDK 23; x86; Google Nexus 5X; ru)'
    },
    longpoll: {
        act: "a_check",
        wait: 25,
        mode: 234,
        version: 1
    }
};

VK.available_methods = require("./available_methods.json");

VK.Array2Object = function(array) {
    if (!Array.isArray(array)) return {};
    return array.reduce(function(r, i) {
        r[i.key] = i.value;
        return r;
    }, {});
};

VK.parseAttachments = function(attachments, type) {
    if (typeof attachments == "object" && !Array.isArray(attachments)) attachments = [attachments];
    if (!Array.isArray(attachments)) return "";
    return attachments.map(function(a) {
        if (typeof a.type !== "string")
            return (type || "") + a.owner_id + "_" + a.id + (a.access_key ? "_" + a.access_key : "");
        var e = a[a.type];
        if (a.type == "sticker") return "sticker_" + e.id;
        return a.type + e.owner_id + "_" + e.id + (e.access_key ? "_" + e.access_key : "");
    }).join(",");
};

VK.getAttachmentUrl = function(attachment) {
    if (typeof attachment !== "object") return "";
    var a = attachment.type ? attachment[attachment.type] : attachment;
    return a.photo_2560 || a.photo_1280 ||
        a.photo_807 || a.photo_800 ||
        a.photo_640 || a.photo_604 ||
        a.photo_512 || a.photo_352 ||
        a.photo_320 || a.thumb_256 ||
        a.photo_256 || a.photo_200 ||
        a.photo_128 || a.photo_130 ||
        a.photo_100 || a.thumb_96 ||
        a.photo_75 || a.photo_64 ||
        a.photo_50 || a.thumb_48 ||
        a.src || a.url || "";
};

module.exports = VK;
