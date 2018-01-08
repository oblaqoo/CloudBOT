var request = require('request'),
    fs      = require('fs'),
    path    = require('path'),
    mkdirp  = require('mkdirp');

var RuCaptcha = function(params){
  if (params.tmpDir)
    params.tmpDir = path.resolve(params.tmpDir);
  else
    params.tmpDir = path.resolve('./tmp');

  params.checkDelay = params.checkDelay || 1000;
  mkdirp.sync(params.tmpDir);

  var downloadFile = function(url, cb){
    request({
      url: url,
      encoding: null
    }, function(err, res, body){
      if (err)
        cb(err);
      else {
        if (res.statusCode > 400 || !body)
          cb('Couldn\'t download file');
        else {
          var fileName = url.substring(url.lastIndexOf('/')+1); //only filename
          fileName = fileName.substring(0, fileName.indexOf('?')); //no query params

          var filePath = path.join(params.tmpDir, Date.now() + '.png');
          fs.writeFile(filePath, body, function(err){
            if (err)
              cb(err);
            else
              cb(null, filePath);
          });
        }
      }
    });
  };

  var getAnswer = function(captchaId, cb){
    request({
      url: 'http://rucaptcha.com/res.php',
      qs: {
        key: params.apiKey,
        action: 'get',
        id: captchaId
      }
    }, function(err, res, body){
      if (body === 'CAPCHA_NOT_READY')
        setTimeout(function(){
          getAnswer(captchaId, cb);
        }, params.checkDelay);
      else
        cb(null, body.split('|')[1]);
    });
  };

  var uploadFile = function(fileName, cb){
    request({
      method: 'POST',
      url: 'http://rucaptcha.com/in.php',
      formData: {
        key:      params.apiKey,
        file:     fs.createReadStream(fileName),
        phrase:   0,
        regsense: 0,
        numeric:  0,
        calc:     0,
        min_leng: 0,
        max_len:  0,
        language: 0,
        soft_id: 2853725
      }
    }, function(err, res, body){
      if (res.statusCode === 200 && !err && body.indexOf('ERROR') === -1)
        getAnswer(body.split('|')[1], cb);
      else
        cb(err || body);
    });
  };

  var solveCaptcha = function(captchaPath, cb){
    //check whether path is url
    var is_url = /^(http|https|ftp){1}\:\/\//.test(captchaPath);

    if (is_url){
      downloadFile(captchaPath, function(err, filePath){
        if (!err){
          uploadFile(filePath, cb);
        } else
          cb(err);
      });
    } else
      uploadFile(captchaPath, cb);
  };

  return {
    solve: solveCaptcha
  };
};

module.exports = RuCaptcha;
