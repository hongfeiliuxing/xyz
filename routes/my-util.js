/**
 * Created by Administrator on 2015/4/10.
 */
var fs = require('fs');
var superagent = require('superagent');
var parseXML = require('xml2js').parseString;
var gm = require('gm').subClass({imageMagick: true});

module.exports.base64_encode = function (file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

// function to create file from base64 encoded string
module.exports.base64_decode = function (base64str, file) {
    if (file == undefined) file = '';
    var data = base64str.split(';base64,', 2);
    var type = data[0].split('/')[1];
    var bitmap = new Buffer(data[1], 'base64');
    file = file
    + Math.floor(Math.random() * 10000).toString(36)
    + new Date().getTime().toString(36) + "." + type;
    fs.writeFileSync('./public/file/download/'+file, bitmap);
    return file;
}

module.exports.sendLoginCode = function (mobile, code, cb) {


    superagent.post('http://106.ihuyi.cn/webservice/sms.php?method=Submit')
        .send({
            account: 'cf_paiwode', password: 'pwd1816168', mobile: mobile,
            content: '感谢您的注册！您的验证码是：【' + code + '】。请不要把验证码泄露给其他人。如非本人操作，可不用理会！'
        })
        .set("Content-Type", "application/x-www-form-urlencoded")
        .set("Connection", "Keep-Alive")
        .end(function (err, sres) {
            if (err) {
                cb(err);
            } else {
                //console.log(sres.text);
                //var data = JSON.parse(sres.text);
                console.log(sres.text);
                parseXML(sres.text, function (err, result) {
                    if (err) return cb(err);
                    result = result.SubmitResult;
                    //cb(null,result);
                    if (result.code[0] == 2) {
                        cb(null, result.msg[0]);
                    } else {
                        cb(result.msg[0]);
                        //console.log(result.ms)
                    }
                    //console.log(result.code[0]);
                    //console.log(result.msg[0]);
                })
            }
        })
}


function resize(path, fileName, sizeTo, cb) {
    gm(path + fileName)
        .size(function (err, size) {
            if (!err) {
                gm(path) //可以考虑进行判断来设置是否是最大的尺寸
                    .resize(sizeTo, sizeTo / size.width * size.height)
                    .noProfile()
                    .write(path + "small/" + fileName, function (err) {
                        if (!cb) cb(err);
                    });
            } else {
                if (!cb) cb(err);
            }
        });
}