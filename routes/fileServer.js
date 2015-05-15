/**
 * Created by Administrator on 2015/3/28.
 */

var path = require('path');
var morgan = require('morgan');
var multer = require('multer');//文件上传中间件
var uuid = require('node-uuid');
var fs = require('fs-extra');

var express = require('express');
var router = express.Router();
var gm = require('gm').subClass({imageMagick: true});

router.use(morgan('combined'));
//router.use(express.static(path.join(__dirname, 'static')));

router.use(multer({
    dest: './public/file/download',
    rename: function (type, filename) {
        //console.log("rename" + filename + "  " + filename.filename);
        return Math.floor(Math.random()*10000).toString(36) + new Date().getTime().toString(36);// "abc" + filename;
    },
    onFileUploadStart: function (file) {
    },
    onFileUploadComplete: function (file) {
    }
}));


router.post('/photo', function (req, res) {
    var fileName = req.files.file.name;
    //压缩图片
    //resize("static/download/", fileName, 64);
    console.log(req.body);
    res.json({success: true, message: fileName});
    res.end();
});

router.post('/icon', function (req, res) {
    var fileName = req.files.file.name;
    //增加验证
    if (!req.session.user||!req.session.user.id) {
        fs.remove('./public/file/download/'+fileName,function(err) {
            res.send({success:false});
        })
    }



    fs.move('./public/file/download/'+fileName, './public/file/download/icon/'+fileName, function (err) {
        if (err) return res.send({success:false,message:err});
        //console.log("success!")
        res.send({success:true,message:'icon/'+fileName});
    })


//    resize("static/download/", fileName, 64, function (err) {
//if (err) return res.send({success:false,message:err});
//        res.send({success:true,message:fileName});
//    });
});

/*
 app.listen(3001, function () {
 console.log("Working on port 3001");
 });
 */
module.exports = router;

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
