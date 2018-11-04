/* 
	Module by flyink13
	Modified by oblaqoo
*/

var https = require('https'),
    http = require('http'),
    url = require('url'),
    querystring = require('querystring'),
    stream = require('stream'),
    Message = require('./vk_msg');

function VK(access_token, options) {
    var global_request_id = 0;
    options = Object.assign({}, VK.default_options, options);

    // Секция отвечающая за запросы
    function request(_options, data) {
        return new Promise(function buildPromise(resolve, reject) {
            if (typeof _options == 'string') {
                _options = Object.assign({
                    method: 'GET'
                }, url.parse(_options, true, false));
            }
            if (_options.method == 'GET') {
                _options.query = Object.assign({}, _options.query, data);
                _options.search = '?' + querystring.stringify(_options.query);
                _options.path = _options.pathname + _options.search;
            }
            _options = Object.assign({}, options, _options);
            var m = _options.protocol == 'http' ? http : https;
            var req = m.request(_options, function onResponse(res) {
                var buffers = [];
                req.setTimeout(options.timeout);
                res.on('data', function onData(c) {
                    buffers.push(c)
                });
                res.on('end', function onEnd() {
                    if (res.statusCode !== 200) {
                        return reject({
                            res: res,
                            req: req,
                            body: Buffer.concat(buffers),
                            statusCode: res.statusCode
                        });
                    }
                    res = undefined;
                    req = undefined;
                    data = undefined;
                    resolve(Buffer.concat(buffers));
                });
                res.on('error', reject);
            }).on('error', reject);
            if (_options.method == 'GET') {
                req.end();
            } else if (typeof data === 'object' && typeof data.pipe === 'function') {
                data.pipe(req);
            } else {
                req.end(data);
            }
        }).catch(function onError(error) {
            if ([302, 301].indexOf(error.statusCode) > -1 && error.res.headers.location) {
                let opts = Object.assign(_options, url.parse(error.res.headers.location));
                return request(opts, data);
            }
            throw {
                error: {
                    error_code: error.statusCode || -1,
                    error_msg: 'I/O Error',
                    _options,
                    error: error
                }
            };
        });
    }

    function tryJSON(body) {
        return new Promise(function tryJSON(resolve, reject) {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject({
                    error: {
                        error_code: -2,
                        error_msg: 'Parse Error',
                        error: error,
                        body: body
                    }
                });
            }
        });
    }

    function vk(method, data, additional_data) {
        data = Object.assign({
            headers: options.headers
        }, options.body, data, additional_data);

        if (!data.ignore_cart && vk.cart.timer !== false) {
            return new Promise(function waitExecute(resolve, reject) {
                delete data.headers;
                vk.cart.list.push({
                    method: method,
                    data: data,
                    resolve: resolve,
                    reject: reject
                });
            });
        }

        delete data.ignore_cart;
        if (vk.cart.timer === false) vk.cart.init();

        data.access_token = data.access_token || access_token;

        var headers = Object.assign({}, data.headers);
        delete data.headers;

        var request_id = global_request_id++;
        var ping = Date.now();

        vk.on('request', {
            method: method,
            request_id: request_id,
            headers: headers,
            data: data
        });

        return request({
            path: '/method/' + method,
            headers: headers
        }, querystring.stringify(data))
            .then(tryJSON)
            .then(function onJSON(body) {
                if (body.error) throw body.error;
                vk.on('response', body.response, {
                    method: method,
                    request_id: request_id,
                    ping: Date.now() - ping
                });
                return method == 'execute' ? body : body.response;
            })
            .catch(function onError(error) {
                if (error.error_code == 6 && data.retry !== false) {
                    return new Promise(function retryRequest(resolve, reject) {
                        if (vk.cart.timer === false) vk.cart.init();
                        vk.on('retry', { method: method });
                        vk.cart.list.unshift({
                            method: method,
                            data: data,
                            resolve: resolve,
                            reject: reject
                        });
                    });
                } else if (error.error_code == 14 && data.reject_captcha !== true) {
                    return new Promise(function onCaptcha(resolve, reject) {
                        vk.on('captcha', {
                            captcha_img: error.captcha_img,
                            method: method,
                            data: data,
                            error: error,
                            submit: function submit(captcha_key) {
                                vk(method, Object.assign(data, {
                                    captcha_sid: error.captcha_sid,
                                    captcha_key: captcha_key
                                })).then(resolve, reject);
                            }
                        });
                    });
                }
                const errorData = {
                    error: error,
                    method: method,
                    data: data,
                    retry: vk.bind(this, method, data)
                };

                vk.on('error', errorData);
                throw errorData;
            });
    }

    // Создаем секции и фунции методов
    VK.available_methods.forEach(function addMethod(method) {
        if (method.indexOf('.') == -1) {
            vk[method] = vk.bind(this, method);
        } else {
            method = method.split('.');
            if (!vk[method[0]]) vk[method[0]] = {};
            vk[method[0]][method[1]] = vk.bind(this, method.join('.'));
        }
    });

    // Секция отвечающая за события
    vk.listeners = {
        '*': []
    };

    vk.on = function onEvent(eventName, data, additionalData) {
        if (!vk.listeners[eventName]) vk.listeners[eventName] = [];
        if (typeof data == 'function') {
            vk.listeners[eventName].push(data);
        } else {
            vk.listeners[eventName]
                .concat(vk.listeners['*'])
                .forEach(function emit(listener) {
                    if (typeof listener !== 'function') return;
                    listener(Object.assign({
                        data: data,
                        eventName: eventName
                    }, additionalData), data);
                });
        }
        return data;
    };

    // Секция отвечающая за сообщения

    vk.longpoll = {
        exit: false,
        started: false,
        stop: function stopLongpoll(callback) {
            return new Promise(function stopLongpoll(resolve) {
                vk.longpoll.exit = function stopLongpoll(data) {
                    resolve(data);
                    if (callback) callback(data);
                };

                if (vk.longpoll.started) return;

                vk.longpoll.exit({
                    error: 'stop longpoll'
                });
            });
        },
        start: function startLongpoll(opts) {
            vk.longpoll.started = true;
            vk('messages.getLongPollServer', {
                use_ssl: 1,
                need_pts: 1
            }).then(function onResponse(data) {
                return vk.longpoll.listen(Object.assign(data, options.longpoll, opts));
            });
            return vk;
        },
        listen: function getUpdates(data) {
            if (!data.server) throw { error: 'Invalid server', data };
            vk.on('LongPollRequest', data);
            return request('https://' + data.server + '?' + querystring.stringify(data))
                .then(tryJSON)
                .then(function parseUpdates(body) {
                    vk.on('LongPollResponse', body);
                    if (body.error || body.failed) {
                        throw body;
                    } else if (body.updates) {
                        body.updates.forEach(vk.on.bind(this, 'update'));
                        data.ts = body.ts;
                    }
                    if (vk.longpoll.exit) throw data;
                    return vk.longpoll.listen(data);
                }).catch(function onError(e) {
                    if (vk.longpoll.exit) {
                        if (typeof vk.longpoll.exit == 'function') vk.longpoll.exit(e);
                        vk.longpoll.exit = false;
                        vk.longpoll.started = false;
                        return vk.on('LongPollStop', e);
                    }
                    vk.on('LongPollError', e);
                    return vk.longpoll.start(options);
                });
        }
    };

    vk.on('update', function onLongpollUpdate(event) {
        if (event.data[0] !== 4) return;
        var message = Message.parseLongPoll(event.data);
        message = vk.createMessage(message);
        vk.on('message', message);
    });

    vk.createMessage = function createMessage(messageData) {
        var message = new Message(messageData);

        Object.defineProperty(message, 'vk', {
            enumerable: false,
            get: function getVK() {
                return vk;
            }
        });

        return message;
    };

    // Секция отвечающая за Callback API
    vk.callback_api = {
        getCallback: function (key, secret, data) {
            return function onRequest(req, res) {
                if (req.method !== 'POST') {
                    return req.connection.destroy();
                }

                var body = '';
                req.on('data', function onData(chunk) {
                    if (body.length > 1e6) {
                        body = null;
                        req.connection.destroy();
                    } else {
                        body += chunk;
                    }
                });
                req.on('end', function onClose() {
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
                        return res.end('Invalid secret');
                    } else if (body.type == 'confirmation') {
                        vk.on('confirmation', body.object, {
                            reject: function onReject(description) {
                                body.$.key = description;
                            }
                        });
                        return res.end(body.$.key);
                    } else if (body.type == 'message_reply' || body.type == 'message_new') {
                        body.object.out = body.type == 'message_reply';
                        body.object.$ = body.$;
                        vk.on('message', vk.createMessage(body.object), {
                            ok: function onResponse(code) {
                                res.end(code || 'OK');
                            }
                        });
                    } else {
                        vk.on(body.type, body, {
                            ok: function onResponse(code) {
                                res.end(code || 'OK');
                            }
                        });
                    }
                });
            };
        },
        setServer: function setServer(opts) {
            return vk.groups.getCallbackConfirmationCode(opts).then(function onResponse(r) {
                opts.code = r.code;
                if (!opts.serverModule) opts.serverModule = http;
                var serverOpts = [opts.code];
                if (opts.secret_key) serverOpts.push(opts.secret_key);
                if (opts.serverData) serverOpts.push(opts.serverData);
                opts.callback = vk.callback_api.getCallback(...serverOpts);
                opts.server = opts.serverModule(opts.callback);
                if (!opts.listen) {
                    return Promise.reject('Invalid server listener');
                }
                return new Promise(function startListen(resolve, reject) {
                    opts.server.listen(opts.listen, function onError(err) {
                        if (err) {
                            return reject(err);
                        }
                        resolve();
                    });
                });
            }).then(function onListen() {
                return vk.groups.getCallbackServers(opts);
            }).then(function onResponse(res) {
                var similarServer = res.items.find(function findSimilarServer(x) {
                    return x.url == opts.url;
                });

                if (similarServer && similarServer.status == 'ok') {
                    return {
                        server_id: similarServer.id
                    };
                }

                opts.title = opts.title || opts.url.replace(/^.+?\/\//, '').substr(0, 14);

                if (!similarServer) {
                    return vk.groups.addCallbackServer(opts);
                }

                opts.server_id = similarServer.id;

                return vk.groups.editCallbackServer(opts);
            }).then(function onEditResponse(r) {
                opts.server_id = r.server_id;
                return vk.groups.setCallbackSettings(opts);
            }).then(function onResponse() {
                return opts;
            });
        },
        initAllListeners: function initAllListeners() {
            vk.on('*', function onCallbackEvent(event) {
                if (!vk.listeners[event.eventName]) vk.listeners[event.eventName] = [];
                if (!event.ok || vk.listeners[event.eventName].length) return;
                event.ok();
            });
        }
    };
    vk.init_callback_api = vk.callback_api.getCallback;

    // Секция отвечающая за очередь запросов
    vk.cart = {
        list: [],
        timer: false,
        execute: false,
        init: function cartInit(interval) {
            vk.cart.timer = setInterval(function onCartTick() {
                if (!vk.cart.list.length) {
                    if (!options.disable_auto_deinit_cart) vk.cart.deinit();
                    return;
                }
                var req = vk.cart.list.shift();

                if (vk.cart.execute && vk.cart.list.length && req.method !== 'execute') {
                    req = vk.build_execute_request(req, vk.cart.list);
                }

                vk(req.method, req.data, {
                    ignore_cart: true
                }).then(req.resolve, req.reject);
            }, interval || options.cart_interval);
        },
        deinit: function cartDeinit() {
            clearInterval(vk.cart.timer);
            vk.cart.timer = false;
        }
    };

    vk.requestStringify = function requestStringify(method, data) {
        delete data.reject_captcha;
        return 'API.' + method + '(' + JSON.stringify(data) + ')';
    };

    vk.build_execute_request = function buildExecuteRequest(request, cart) {
        var limit = 4000;

        if (vk.requestStringify(request.method, request.data).length > limit) {
            return request;
        }

        var code = 'return [' + vk.requestStringify(request.method, request.data),
            executeCart = [request];


        var requestCode = '';

        for (let i = 0; i < cart.length; i++) {
            if (/^execute/.test(cart[i].method) || cart[i].data.ignore_execute_cart || cart[i].data.access_token) continue;
            requestCode = ',' + vk.requestStringify(cart[i].method, cart[i].data);
            if (code.length + requestCode.length > limit || executeCart.length >= 25) break;
            code += requestCode;
            executeCart.push(cart.splice(i, 1)[0]);
            i--;
        }

        code += '];';

        return {
            method: 'execute',
            data: {
                code: code
            },
            resolve: function parseResponse(r) {
                if (!r.response) throw r;
                var error_index = 0;
                r.response.forEach(function(i, ii) {
                    if (i) {
                        return executeCart[ii].resolve(i);
                    } else if (r.execute_errors && r.execute_errors[error_index]) {
                        executeCart[ii].reject(r.execute_errors[error_index]);
                        error_index++;
                    } else {
                        return executeCart[ii].resolve(i);
                    }
                });
            },
            reject: function rejectAll(e) {
                executeCart.forEach(function reject(req) {
                    req.reject(e)
                });
            }
        };
    };

    vk.init_execute_cart = function initExecuteCart(interval) {
        vk.cart.execute = true;
        vk.cart.init(interval);
    };

    // Автоматический перебор с offset
    vk.getAll = function getAll(method, data, onstep) {
        return new Promise(function buildRequest(resolve, reject) {
            var response = [];
            data = Object.assign({
                count: 100
            }, data);

            (function next(offset) {
                var max_requests = 25,
                    requests = [];

                while (max_requests--) {
                    requests.push('API.' + method + '(data + {offset: ' + offset + '})');
                    offset += data.count;
                }

                vk('execute', {
                    access_token: access_token || data.access_token,
                    code: 'var data = ' + JSON.stringify(data || {}) + ';' +
                        'return [' + requests.join(',') + '];'
                }).then(function onResponse(r) {
                    if (!r.response[0].items) throw 'unsuppodted method or invalid data';

                    var items = r.response.reduce(function concatAll(pv, cv) {
                        return pv.concat(cv.items);
                    }, []);

                    response = response.concat(items);

                    if (onstep) {
                        onstep({
                            offset: offset,
                            count: r.response[0].count,
                            new_items: items,
                            all_items: response
                        });
                    }
                    if (offset >= r.response[0].count || offset >= data.max_offset) {
                        return resolve(response);
                    }
                    next(offset);
                }).catch(reject);
            })(0);
        });
    };

    // Авторизация
    vk.setToken = function setToken(newToken) {
        access_token = newToken;
    };

    vk.auth = function (data) {
        return vk.request('https://oauth.vk.com/token', Object.assign({
            '2fa_supported': 1,
            grant_type: 'password',
            scope: 'all',
            client_id: '2274003',
            client_secret: 'hHbZxrka2uZ6jB1inYsH'
        }, data)).then(vk.tryJSON).then(function onResponse(r) {
            if (!r.access_token) throw r;
            vk.setToken(r.access_token);
            return r;
        });
    };

    // Методы для загрузкки файлов
    vk.upload = function upload(get_server_method, save_method, data) {
        if (data && !data.files && (data.pipe || data.buffer) || Buffer.isBuffer(data)) {
            if (Buffer.isBuffer(data)) {
                data = {
                    buffer: data
                };
            }
            if (/^photos\.getWall|Owner|Messages/.test(get_server_method)) {
                data = {
                    files: {
                        photo: data
                    }
                };
            } else if (get_server_method == 'photos.getUploadServer') {
                data = {
                    files: {
                        file1: data
                    }
                };
            } else if (get_server_method == 'video.save') {
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

        if (!data || !data.files) {
            Promise.reject({
                retry: vk.upload.bind(this, get_server_method, save_method, data),
                error: {
                    error_code: -400,
                    error_msg: 'Nothing to upload'
                }
            });
        }

        return vk(get_server_method, data.get || {})
            .then(function onServerData(r) {
                var boundary =
                    (Math.random() * 1e18).toString(16) +
                    (Math.random() * 1e18).toString(16);

                vk.on('upload.get_server', r.upload_url);
                var _options = url.parse(r.upload_url);
                _options.method = 'POST';
                _options.headers = {
                    'Content-Type': 'multipart/form-data;boundary=' + boundary
                };
                var rs = new stream.PassThrough();

                var files = Object.keys(data.files);
                (function sendPart() {
                    if (!files.length) {
                        rs.push('\n--' + boundary + '--\n');
                        vk.on('upload.end', true);
                        return rs.push(null);
                    }
                    var name = files.shift();
                    var part = data.files[name];

                    if (!part.filename && !part.path && part.req && part.req.path) {
                        part.filename = part.req.path.replace(/(.+)(\/|\\)/, '').replace(/\?.+$/, '');
                    }
                    if (!part.filename) {
                        part.filename = part.path ? part.path.replace(/(.+)(\/|\\)/, '') : options.filename;
                    }

                    vk.on('upload.part', part);
                    rs.push('\n--' + boundary + '\nContent-Disposition: form-data; name="' + name + '"; filename="' + part.filename + '"\n\n');
                    if (part.readable) {
                        part.pipe(rs, {
                            end: false
                        });
                        part.on('end', function onEnd() {
                            vk.on('part_end', part);
                            sendPart();
                        });
                    } else if (part.buffer) {
                        rs.push(part.buffer);
                        sendPart();
                    } else {
                        console.warn('VK.upload: unsupported data type');
                        sendPart();
                    }
                })();

                return request(_options, rs);
            }).then(tryJSON)
            .then(function onUploadDone(body) {
                vk.on('upload.save', body);
                if (body.error) {
                    throw {
                        retry: vk.upload.bind(this, get_server_method, save_method, data),
                        error: body.error
                    };
                }
                if (save_method == 'return') return body;
                return vk(save_method, Object.assign(data.save || {}, body));
            });
    };

    vk.upload.photo = vk.upload.bind(this, 'photos.getUploadServer', 'photos.save');
    vk.upload.wallPhoto = vk.upload.bind(this, 'photos.getWallUploadServer', 'photos.saveWallPhoto');
    vk.upload.ownerPhoto = vk.upload.bind(this, 'photos.getOwnerPhotoUploadServer', 'photos.save');
    vk.upload.messagesPhoto = vk.upload.bind(this, 'photos.getMessagesUploadServer', 'photos.saveMessagesPhoto');
    vk.upload.marketPhoto = vk.upload.bind(this, 'photos.getMarketUploadServer', 'photos.saveMarketPhoto');
    vk.upload.marketAlbumPhoto = vk.upload.bind(this, 'photos.getMarketAlbumUploadServer', 'photos.saveMarketAlbumPhoto');
    vk.upload.audio = vk.upload.bind(this, 'audio.getUploadServer', 'audio.save');
    vk.upload.video = vk.upload.bind(this, 'video.save', 'video.save');
    vk.upload.doc = vk.upload.bind(this, 'docs.getUploadServer', 'docs.save');
    vk.upload.wallDoc = vk.upload.bind(this, 'docs.getWallUploadServer', 'docs.save');
    vk.upload.groupCover = vk.upload.bind(this, 'photos.getOwnerCoverPhotoUploadServer', 'photos.saveOwnerCoverPhoto');

    vk.upload.widgetsAppImage = vk.upload.bind(this, 'appWidgets.getAppImageUploadServer', 'appWidgets.saveAppImage');
    vk.upload.widgetsGroupImage = vk.upload.bind(this, 'appWidgets.getGroupImageUploadServer', 'appWidgets.saveGroupImage');

    vk.upload.storiesPhoto = vk.upload.bind(this, 'stories.getPhotoUploadServer', 'return');
    vk.upload.storiesVideo = vk.upload.bind(this, 'stories.getVideoUploadServer', 'return');
    vk.upload.chatPhoto = function uploadChat(opts) {
        return vk.upload('photos.getChatUploadServer', 'return', opts)
        .then(function onUploadDone(r) {
            return vk.messages.setChatPhoto({
                file: r.response
            });
        })
    };

    vk.upload.photos = vk.upload.photo;
    vk.upload.docs = vk.upload.doc;
    vk.upload.wallDocs = vk.upload.wallDoc;
    vk.upload.wallPhotos = vk.upload.wallPhoto;

    return Object.assign(vk, {
        request: request,
        tryJSON: tryJSON,
        options: options,
        https: https,
        VK: VK
    });
}

VK.default_options = {
    filename: 'photo.png',
    cart_interval: 334,
    timeout: 120000,
    host: 'api.vk.com',
    method: 'POST',
    body: {
        v: '5.69'
    },
    headers: {
        'user-agent': 'npm/VK-Promise'
    },
    longpoll: {
        act: 'a_check',
        wait: 25,
        mode: 234,
        version: 1
    }
};

VK.available_methods = require('./available_methods.json');

VK.Array2Object = function Array2Object(array) {
    if (!Array.isArray(array)) return {};
    return array.reduce(function setValue(r, i) {
        r[i.key] = i.value;
        return r;
    }, {});
};

VK.parseAttachments = function parseAttachments(attachments, type) {
    if (typeof attachments == 'object' && !Array.isArray(attachments)) attachments = [attachments];
    if (!Array.isArray(attachments)) return '';
    return attachments.map(function buildID(a) {
        if (typeof a.type !== 'string') {
            return (type || '') + a.owner_id + '_' + a.id + (a.access_key ? '_' + a.access_key : '');
        }
        var e = a[a.type];
        if (a.type == 'sticker') return 'sticker_' + e.id;
        return a.type + e.owner_id + '_' + e.id + (e.access_key ? '_' + e.access_key : '');
    }).join(',');
};

VK.getAttachmentUrl = function getAttachmentUrl(attachment) {
    if (typeof attachment !== 'object') return '';
    var a = attachment.type ? attachment[attachment.type] : attachment;
    return a.photo_2560 || a.photo_1280 ||
        a.photo_807 || a.photo_800 ||
        a.photo_640 || a.photo_604 ||
        a.photo_512 || a.photo_352 ||
        a.photo_320 || a.thumb_256 ||
        a.photo_256 || a.photo_200 ||
        a.photo_128 || a.photo_130 ||
        a.photo_100 || a.thumb_96  ||
        a.photo_75  || a.photo_64  ||
        a.photo_50  || a.thumb_48  ||
        a.src       || a.url       || '';
};

module.exports = VK;
