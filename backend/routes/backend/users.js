/**
 * Created by Administrator on 2015/3/31.
 */

var express = require('express');
var router = express.Router();
var url = require('url');

router.post('/login', function (req, res, next) {

    var input = JSON.parse(JSON.stringify(req.body));
    var data = {
        username: input.username,
        password: input.password
    };

    if (data.username === 'admin' && data.password === '123456') {
        req.session.admin = true;
        res.send({success: true});
    } else {
        res.send({success: false});
    }
});
router.all('*', function(req,res,next) {
    console.log("permission");
    if(req.session.admin) return next();
    else res.send({success:false});//res.send()//重定向到登录界面
})


router.get('/logout', function (req, res) {
    req.session.admin = null;
    res.send({success: true});
});


//参数说明：
router.get('/userlist', function (req, res) {
    authentication(res, req);

    var p = url.parse(req.url, true).query;
    if (!p.page) p.page = 1;
    if (!p.limit) p.limit = 10;
    req.models.User.count(function (err, count) {
        if (p.page > (count - 1) / p.limit + 1) p.page = Math.floor((count - 1) / p.limit + 1);
        if (p.page < 1)p.page = 1;
        if (err) return res.send({success: false, message: err});

        req.db.driver.execQuery(
            "SELECT * FROM user left join user_info on id = user_id limit ? , ?"
            , [(p.page - 1) * p.limit, p.limit * 1], function (err, rows) {
                if (err) return res.send({success: false, message: err});
                return res.send({success: true,total: count, data:rows});
            }
        );
    });
});

router.post('/edituserinfo/:id', function (req, res, next) {
    authentication(res, req);
    var input = JSON.parse(JSON.stringify(req.body));
    var id = req.params.id * 1;
    var data = {
        user_id: id
    };
    if (input.favPhotoId) {
        req.models.Photo.get(input.favPhotoId, function (err, photo) {
            if (err) return res.send({success: false, message: err});
            req.body.fav_photo_url = photo.url;
            next();
        })
    } else {
        next();
    }
});

router.post('/edituserinfo/:id', function (req, res) {

    var input = JSON.parse(JSON.stringify(req.body));
    var id = req.params.id * 1;
    var data = {
        user_id: id
    };

    if (input.nickname) data.nickname = input.nickname;
    if (input.sex != undefined) data.sex = input.sex !='false' && input.sex!=0;
    if (input.age) data.age = input.age;
    if (input.icon) data.icon = input.icon;
    if (input.sign) date.sign = input.sign;
    if (input.favPhotoId) {
        data.fav_photo_id = input.favPhotoId;
        data.fav_photo_url = input.fav_photo_url;
    }
    console.log(data);
    req.models.User.exists({id: id},
        function (err, exists) {
            if (exists) {
                req.models.UserInfo.find({user_id: id}, function (err, userInfos) {
                        if (err) return res.send({success: false, message: err});
                            if (userInfos.length>0) {
                                userInfos[0].save(data, function (err) {
                                    if (err) return res.send({success: false, message: err});
                                    res.send({success: true});
                                })
                            } else {
                                req.models.UserInfo.create(data,function(err, userinfo) {
                                    if (err) return res.send({success:false, message:err});
                                    res.send({success:true});
                                })
                            }
                    }
                )
            } else {
                res.send({success: false, message: "用户不存在"});
            }
        });
});

var yanzhi ='select user_info.*,sum(good)*5 as yanzhi'+
    ' from photo,user_info'+
    ' where user_info.user_id = photo.user_id and user_info.user_id = ?';

var jifen = 'select sum(point) as point from (' +
    ' (select user_info.user_id,count(*)*20 as point ' +
    'from user_info,photo where user_info.user_id = photo.user_id and user_info.user_id = ?' +
    ' group by user_id)' +
    ' union all' +
    ' (select user_info.user_id,point' +
    ' from user_info,photo_good' +
    ' where user_info.user_id = photo_good.user_id and user_info.user_id = ?)' +
    ' )as a group by user_id';

router.get('/userinfo/:id', function (req, res) {
    var user_id = req.params.id;
    req.db.driver.execQuery(yanzhi,[user_id],function (err,yanzhi) {
        if (err) return res.send({success:false,message:err,msf:'sd'});
        console.log(yanzhi);
        if (yanzhi.length>0){
            req.db.driver.execQuery(jifen,[user_id,user_id], function (err, jifen) {
                if (err) return res.send({success:false,message:err,msg:'sdfsdfsdf'});
                if (jifen.length>0) yanzhi[0].jifen = jifen[0].point;
                return res.send({success:true,message:yanzhi});
            })
        } else {
            res.send({success:false,message:'服务器忙'});
        }
    })
});


router.get('/search',function(req, res) {
    //username
    var p = url.parse(req.url, true).query;
    if (!p.name) return res.send({success:true,message:[]});
    p.name = '%'+ p.name + '%';
    req.db.driver.execQuery(
        "SELECT  id,username,nickname,sex,age,icon,sign,fav_photo_id,date,updateDate,lastLogin,user_id FROM user left join user_info on id = user_id where username like ? or nickname like ?"
        , [p.name, p.name], function (err, rows) {
            if (err) return res.send({success: false, message: err});
            if (rows.length > 0) {
                return res.send({success: true,total:rows.length, data: rows});
            } else {
                return res.send({success: false, message: '用户不存在'});
            }
        }
    );
});

module.exports = router;

function authentication(res, req) {
    //if (!req.session.admin) {
    //    console.log(req.session.admin);
    //    return res.send({success:false,message:"没有用户权限"});
    //}
}