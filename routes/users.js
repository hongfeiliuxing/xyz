/* GET users listing. */
var express = require('express');
var router = express.Router();
var md5 = require('MD5');
var uuid = require('node-uuid');
var url = require('url');
var my_util = require('./my-util');
var oauth = require('./oauth');
var reg = /^1[3|4|5|7|8][0-9]\d{8}$/;
/* GET users listing. */

router.get('/sendCode', function (req, res, next) {
    var p = url.parse(req.url, true).query;
    var mobile = p.mobile;
    if (!reg.test(mobile)) return res.send({success: false, message: '无效手机号'});
    req.models.User.exists({mobile: mobile},
        function (err, exists) {
            if (exists) {
                res.send({success: false, message: '手机号已被注册'});
            } else {
                req.models.MobileCode.find({mobile: mobile}, function (err, mobileCodes) {
                    if (err) res.send({success: false, message: err});
                    if (mobileCodes.length > 0) {
                        if (new Date() - mobileCodes[0].date > 1000 * 55) {
                            mobileCodes[0].save({
                                mobile: mobile,
                                code: Math.floor((Math.random() * 9 + 1) * 100000)
                            }, function (err) {
                                if (err) return res.send({success: false, message: err});
                                sendMSG(mobile, mobileCodes[0].code, res);
                            })
                        } else {
                            res.send({success: false, message: (60 - (new Date() - mobileCodes[0].date) / 1000)});
                        }
                    } else {
                        //生成code 存入数据库，发送验证码
                        req.models.MobileCode.create({
                                mobile: mobile,
                                code: Math.floor((Math.random() * 9 + 1) * 100000)
                            },
                            function (err, code) {
                                if (err) res.send({success: false, message: err});
                                sendMSG(mobile, code.code, res);
                            });
                    }
                })
            }
        });
});

router.get('/send_reset_code', function (req, res) {
    var p = url.parse(req.url, true).query;
    var mobile = p.mobile;
    if (!reg.test(mobile)) return res.send({success: false, message: '无效手机号'});
    req.models.User.exists({mobile: mobile},
        function (err, exists) {
            if (exists) {

                req.models.MobileCode.find({mobile: mobile, type: 1}, function (err, mobileCodes) {
                    if (err) res.send({success: false, message: err});
                    if (mobileCodes.length > 0) {
                        if (new Date() - mobileCodes[0].date > 1000 * 55) {
                            mobileCodes[0].save({
                                mobile: mobile,
                                code: Math.floor((Math.random() * 9 + 1) * 100000)
                            }, function (err) {
                                if (err) return res.send({success: false, message: err});
                                sendMSG(mobile, mobileCodes[0].code, res, 1);
                            })
                        } else {
                            res.send({success: false, message: (60 - (new Date() - mobileCodes[0].date) / 1000)});
                        }
                    } else {
                        //生成code 存入数据库，发送验证码
                        req.models.MobileCode.create({
                                mobile: mobile,
                                code: Math.floor((Math.random() * 9 + 1) * 100000),
                                type: 1
                            },
                            function (err, code) {
                                if (err) res.send({success: false, message: err});
                                sendMSG(mobile, code.code, res, 1);
                            });
                    }
                })
            } else {
                res.send({success: false, message: '用户不存在'});
            }
        });
});

router.get('/vertify_reset_code', function (req, res) {
    var p = url.parse(req.url, true).query;
    var mobile = p.mobile;
    var code = p.code;

    req.models.MobileCode.find({mobile: mobile, type: 1},
        function (err, codes) {
            if (err) return res.send({success: false, message: err});
            if (codes.length > 0) {
                if (codes[0].code != code) {
                    codes[0].count = (codes[0] || 0) + 1;
                    codes[0].save(function (err) {
                        return res.send({success: false, message: '验证码错误'});
                    });
                } else if ((codes[0].count || 0) > 5) {
                    return res.send({success: false, message: '验证码已失效'});
                } else if ((new Date() - codes[0].date) > 1000 * 60 * 60) {
                    return res.send({success: false, message: '验证码已过期'});
                } else {


                    if ((new Date() - codes[0].date) > 1000 * 60 * 60) return res.send({
                        success: false,
                        message: '验证码已过期'
                    });
                    //增加多次尝试破解阻拦
                    res.send({success: true});
                }
            }
            else {
                res.send({success: false, message: '验证码错误'});
            }

        });
});


router.get('/vertify', function (req, res) {
    var p = url.parse(req.url, true).query;
    var mobile = p.mobile;
    var code = p.code;

    req.models.MobileCode.find({mobile: mobile, code: code},
        function (err, codes) {
            if (err) return res.send({success: false, message: err});
            if (codes.length > 0) {
                if ((new Date() - codes[0].date) > 1000 * 60 * 60) return res.send({success: false, message: '验证码已过期'});
                //增加多次尝试破解阻拦
                res.send({success: true});
            } else {
                res.send({success: false, message: '验证码错误'});
            }
        });
})

router.post('/login', function (req, res, next) {

    var input = JSON.parse(JSON.stringify(req.body));
    console.log(req.body);
    var data = {
        username: input.username,
        password: md5(input.password)
        //mobile: input.mobile,
        //wechat_id: input.wechat_id
    };


    if (!data.password) {
        return res.send({success: false, message: '密码不能为空'});
    }

    if (!data.username) return res.send({success: false, message: 'username 不能为空'});

    var loginFilter = {};

    if (reg.test(data.username)) {
        loginFilter.mobile = data.username;
    } else {
        loginFilter.username = data.username;
    }
    //
    //if (data.username) {
    //    loginFilter.username = data.username.toLowerCase();
    //} else if (data.mobile) {
    //    loginFilter.mobile = data.mobile;
    //} else if (data.wechat_id) {
    //    loginFilter.wechat_id = data.wechat_id;
    //} else {
    //    return res.send({success: false, message: '请使用username,mobile,wechat_id登录'});
    //}

    data.date = new Date();

    req.models.User.find(loginFilter).run(function (err, user) {
            if (err) {
                res.send({success: false, message: err});
                return;
            }
            if (user.length > 0) {

                if (data.password !== user[0].password) return res.send({success: false, message: '密码错误'});

                req.session.user = {};
                req.session.user.id = user[0].id;
                console.log(req.session);
                //req.session.user.name = user[0].username;
                var user_id = user[0].id;
                req.db.driver.execQuery(yanzhi, [user_id], function (err, yanzhi) {
                    if (err) return res.send({success: false, message: err});
                    console.log(yanzhi);
                    if (yanzhi.length > 0) {
                        if (!yanzhi[0].yanzhi) yanzhi[0].yanzhi = 0;
                        req.db.driver.execQuery(jifen, [user_id, user_id], function (err, jifen) {
                            if (err) return res.send({success: false, message: err});
                            if (jifen.length > 0) yanzhi[0].jifen = jifen[0].point; else yanzhi[0].jifen = 0;
                            return res.send({success: true, message: yanzhi[0]});
                        })
                    } else {
                        //res.send({success:false,message:'服务器忙'});
                        req.models.UserInfo.create({user_id: user[0].id}, function (err, u) {
                            if (err) return res.send({success: false, message: err});
                            u.yanzhi = 0;
                            u.jifen = 0;
                            return res.send({success: true, message: u});
                        })
                    }
                })
                //
                //req.models.UserInfo.find({user_id: user[0].id}, function (err, users) {
                //    if (!err && users.length > 0) {
                //        req.session.user.name = users[0].nickname;
                //        res.send({success: true, message: users[0]});
                //        userInfo(req, 'login');
                //        setTimeout(function () {
                //            users[0].save({lastLogin: new Date()});
                //        }, 1000)
                //
                //    } else {
                //        req.models.UserInfo.create({user_id: user[0].id}, function (err, u) {
                //            if (err) return res.send({success: false, message: err});
                //            return res.send({success: true, message: u});
                //        })
                //    }
                //});


            } else {
                res.send({success: false, message: '用户不存在'});
            }
        }
    );

});


router.get('/logout', function (req, res, next) {

    if (req.session.user) {
        userInfo(req, 'logout');
        req.session.user = null;
    }
    res.send({success: true});
});


router.post('/regist', function (req, res, next) {
    var input = req.body;

    req.models.MobileCode.find({mobile: input.mobile, code: input.code},
        function (err, codes) {
            if (err) return res.send({success: false, message: err});
            if (codes.length > 0) {
                if ((new Date() - codes[0].date) > 1000 * 60 * 60) return res.send({success: fasle, message: '验证码已过期'});
                next();
            } else {
                res.send({success: false, message: '验证码错误'});
            }
        });
});

//router.post('/regist', function (req, res, next) {
//    var input = JSON.parse(JSON.stringify(req.body));
//    if (!req.session.user || !req.session.user.id) {
//        return res.send({success: false, message: '请登录'});
//    }
//    var id = req.session.user.id;
//    if (input.favPhotoId) {
//        req.models.Photo.get(input.favPhotoId, function (err, photo) {
//            if (err) return res.send({success: false, message: err});
//            if(photo.user_id !=id) return res.send(res.send({success:false,message:'照片不存在 '}));
//            req.body.fav_photo_url = photo.url;
//            next();
//        })
//    } else {
//        next();
//    }
//});

router.post('/regist', function (req, res, next) {
    var input = req.body;
    //var userinfo = {};

    if (!input.password) return res.send({success: false, message: '密码不能为空'});
    if (!input.nickname) return res.send({success: false, message: 'nickname 不能为空'});
    if (input.sex == undefined) return res.send({success: false, message: 'sex 不能为空'});
    //if (!input.age) return res.send({success: false, message: 'age 不能为空'});
    //if (!input.birthday) return res.send({success:false,message:'birthday 不能为空'});
    if(!input.star) return res.send({success:false,message:'星座不能为空'});
    if (!input.icon) return res.send({success: false, message: 'icon 不能为空'});
    //if (!input.area) return res.send({success:false,message:'area 不能为空'});
    //if (input.sign) userinfo.sign = input.sign;
    var fileName = my_util.base64_decode(input.icon, 'icon/');
    req.body.icon = fileName;
    // 验证是否已经注册过
    req.models.User.exists({mobile: input.mobile},
        function (err, exists) {
            if (err) res.send({success: false, message: err});
            if (exists) {
                res.send({success: false, message: '该手机号已被注册'});
            } else {
                next();
            }
        });


});

router.post('/regist', function (req, res, next) {
    var input = JSON.parse(JSON.stringify(req.body));
    console.log(input);
    var data = {
        //username: input.username,
        password: md5(input.password),
        mobile: input.mobile
        //wechat_id: input.wechat_id
    };
    var userinfo = {
        nickname: input.nickname,
        sex: input.sex != 'false' && input.sex != 0,
        //age: new Date().getYear() -new Date(input.birthday).getYear(),
        //birthday:new Date(input.birthday),
        //star: getStar(new Date(input.birthday)),
        age:null,
        birthday:null,
        star:input.star,
        icon: input.icon,
        height:input.height||null
        //area:input.area
    };
    if (input.area) userinfo.area = input.area;

    req.db.transaction(function (err, t) {
        console.log('tran');
        if (err) return res.send({success: false, message: err});
        console.log('transaction');
        req.models.User.create(data, function (err, user) {
            console.log("create");
            if (err) {
                res.send({success: false, message: err});
            } else {
                //res.send({success: true, message: user});

                userinfo.user_id = user.id;
                req.models.UserInfo.create(userinfo, function (err, userI) {
                    if (err) return res.send({success: false, message: err});
                    req.session.user = {};
                    req.session.user.id = user.id;
                    req.session.nickname = userI.nickname;
                    res.send({success: true, message: userI});
                })
            }
        });


        t.commit(function (err) {
            if (err) return res.send({success: false, message: err});
        });
    })


});

//router.get('/', function (req, res, next) {
//    userInfo(req, 'test');
//    res.send('abc');
//});

router.post('/isLogin', function (req, res) {
    if (!req.session.user || !req.session.user.id) {
        return res.send({success: false, message: '请登录'});
    } else {
        return res.send({success: true, message: req.session.user});
    }
});

router.get('/isLogin', function (req, res) {
    if (!req.session.user || !req.session.user.id) {
        return res.send({success: false, message: '请登录'});
    } else {
        return res.send({success: true, message: req.session.user});
    }
});
//
//router.post('/edituserinfo/', function (req, res, next) {
//    var input = JSON.parse(JSON.stringify(req.body));
//    if (!req.session.user || !req.session.user.id) {
//        return res.send({success: false, message: '请登录'});
//    }
//    var id = req.session.user.id;
//    if (input.favPhotoId) {
//        req.models.Photo.get(input.favPhotoId, function (err, photo) {
//            if (err) return res.send({success: false, message: err});
//            if(photo.user_id !=id) return res.send(res.send({success:false,message:'照片不存在 '}));
//            req.body.fav_photo_url = photo.url;
//            next();
//        })
//    } else {
//        next();
//    }
//
//    if (input.favPhotoId) {
//        data.fav_photo_id = input.favPhotoId;
//        data.fav_photo_url = input.fav_photo_url;
//        console.log(data);
//    }
//});

router.post('/edituserinfo/', function (req, res, next) {
    if (!oauth.oauth(req)) {
        return res.send({success: false, message: '请登录'});
    }
    var id = req.session.user.id;

    var input = JSON.parse(JSON.stringify(req.body));

    var data = {
        user_id: id
    };
    if (input.nickname) data.nickname = input.nickname;
    if (input.sex != undefined) data.sex = input.sex != 'false' && input.sex != 0;
    //if (input.age) data.age = input.age;
    if (input.area) data.area = input.area;
    if (input.height) data.height = input.height;

    if (input.birthday) {
        data.birthday = new Date(input.birthday);
        data.star = getStar(new Date(input.birthday));
        data.age = new Date().getYear() -new Date(input.birthday).getYear();
    }
    console.log(data);
    if (input.icon) {
        var fileName = my_util.base64_decode(input.icon, 'icon/');
        //req.body.icon = filename;
        data.icon = fileName;
    }
    if (input.sign) date.sign = input.sign;

    data.updateDate = new Date();

    req.models.UserInfo.exists({user_id: id},
        function (err, exists) {
            if (exists) {
                req.models.UserInfo.find({user_id: id}, function (err, userInfos) {
                    if (err) return res.send({success: false, message: err});
                    console.log(userInfos);
                    userInfos[0].save(data, function (err) {
                        if (err) return res.send({success: false, message: err});
                        res.send({success: true});
                    })
                })
            } else {
                req.models.UserInfo.create(data, function (err, user) {
                    if (err) {
                        res.send({success: false, message: err});
                    } else {
                        res.send({success: true});
                    }
                });
            }
        });
});

/*
 router.post('/edituserinfo/:id', function (req, res, next) {
 var id = req.params.id;


 var input = JSON.parse(JSON.stringify(req.body));

 var data = {
 user_id: id
 };
 if (input.nickname) data.nickname = input.nickname;
 if (input.sex != undefined) data.sex = input.sex !='false' && input.sex!=0;
 if (input.age) data.age = input.age;
 if (input.area) data.area = input.area;
 if (input.icon) {
 var fileName = my_util.base64_decode(input.icon, 'icon/');
 //req.body.icon = filename;
 data.icon = fileName;
 }
 if (input.sign) date.sign = input.sign;

 data.updateDate = new Date();

 req.models.UserInfo.exists({user_id: id},
 function (err, exists) {
 if (exists) {
 req.models.UserInfo.find({user_id: id}, function (err, userInfos) {
 if (err) return res.send({success: false, message: err});
 console.log(userInfos);
 userInfos[0].save(data, function (err) {
 if (err) return res.send({success: false, message: err});
 res.send({success: true});
 })
 })
 } else {
 req.models.UserInfo.create(data, function (err, user) {
 if (err) {
 res.send({success: false, message: err});
 } else {
 res.send({success: true});
 }
 });
 }
 });
 });
 */

router.post('/modifypassword', function (req, res, next) {
    if (!oauth.oauth(req)) {
        return res.send({success: false, message: '请登录'});
    }
    var id = req.session.user.id;
    var input = JSON.parse(JSON.stringify(req.body));
    var data = {
        password: md5(input.oldPwd),
        newPassword: md5(input.newPwd)
    };


    req.models.User.get(id, function (err, user) {
        if (err) return res.send({success: false, message: err});
        if (user.password === data.password) {
            user.save({password: data.newPassword}, function (err) {
                if (err) return res.send({success: false, message: err});
                res.send({success: true});
            });
        } else {
            res.send({success: false, message: '密码错误'});
        }
    });

});

router.post('/modifypassword2', function (req, res) {
    var input = JSON.parse(JSON.stringify(req.body));
    var mobile = input.mobile;
    var code = input.code;
    if (!input.password) res.send({success: false, message: 'password 不能为空'});
    if (!reg.test(mobile)) return res.send({success: false, message: '无效手机号'});
    if (!input.code) return res.send({success: false, message: '验证码错误'});


    req.models.MobileCode.find({mobile: mobile, type: 1},
        function (err, codes) {
            if (err) return res.send({success: false, message: err});
            if (codes.length > 0) {
                if (codes[0].code != code) {
                    codes[0].count = (codes[0] || 0) + 1;
                    codes[0].save(function (err) {
                        return res.send({success: false, message: '验证码错误'});
                    });
                } else if ((codes[0].count || 0) > 5) {
                    return res.send({success: false, message: '验证码已失效'});
                } else if ((new Date() - codes[0].date) > 1000 * 60 * 60) {
                    return res.send({success: false, message: '验证码已过期'});
                } else {

                    //增加多次尝试破解阻拦
                    req.models.User.find({mobile: mobile}, function (err, users) {
                        if (users.length > 0) {
                            users[0].save({password: md5(input.password)}, function (err) {
                                if (err) return res.send({success: false, message: err});
                                res.send({success: true});
                                req.session.user = {};
                                req.session.user.id = users[0].id;
                                codes[0].remove();
                            });
                        } else {
                            res.send({success: false, message: '用户不存在'});
                        }
                    });
                }
            } else {
                res.send({success: false, message: '手机号不存在'});
            }
        });
});

//
//router.post('/modifypassword/:id', function (req, res, next) {
//    //if (!req.session.user || !req.session.user.id) {
//    //    return res.send({success: false, message: '请登录'});
//    //}
//    var id = req.params.id;
//    var input = JSON.parse(JSON.stringify(req.body));
//    var data = {
//        password: md5(input.oldPwd),
//        newPassword: md5(input.newPwd)
//    };
//
//
//    req.models.User.get(id, function (err, user) {
//        if (err) return res.send({success: false, message: err});
//        if (user.password === data.password) {
//            user.save({password: data.newPassword}, function (err) {
//                if (err) return res.send({success: false, message: err});
//                res.send({success: true});
//            });
//        } else {
//            res.send({success: false, message: '密码错误'});
//        }
//    });
//
//});


var yanzhi = 'select user_info.*,sum(good)*5 as yanzhi from user_info left join photo on user_info.user_id = photo.user_id where user_info.user_id = ?';

var jifen = 'select sum(point) as point from (' +
    ' (select user_info.user_id,count(*)*20 as point ' +
    'from user_info,photo where photo.state !=2 and user_info.user_id = photo.user_id and user_info.user_id = ?' +
    ' group by user_id)' +
    ' union all' +
    ' (select user_info.user_id,point' +
    ' from user_info,photo_good' +
    ' where user_info.user_id = photo_good.user_id and user_info.user_id = ?)' +
    ' )as a group by user_id';

//router.get('/userinfo', function (req, res) {
//    if (!oauth.oauth(req)) {
//        return res.send({success: false, message: '请登录'});
//    }
//    var user_id = req.session.user.id * 1;
//    //var user_id = 31;
//
//    req.db.driver.execQuery(yanzhi,[user_id],function (err,yanzhi) {
//        if (err) return res.send({success:false,message:err});
//        console.log(yanzhi);
//        if (yanzhi.length>0){
//            if (!yanzhi[0].user_id) return res.send({success:false,message:'用户不存在'});
//            if (!yanzhi[0].yanzhi) yanzhi[0].yanzhi = 0;
//            req.db.driver.execQuery(jifen,[user_id,user_id], function (err, jifen) {
//                if (err) return res.send({success:false,message:err});
//
//                if (jifen.length>0) yanzhi[0].jifen = jifen[0].point; else yanzhi[0].jifen = 0;
//
//                return res.send({success:true,message:yanzhi[0]});
//            })
//        } else {
//            res.send({success:false,message:'服务器忙'});
//        }
//    })
//});

router.get('/userinfo', function (req, res) {
	console.log(req.user);
    if (!oauth.oauth(req)) {
        return res.send({success: false, message: '请登录'});
    }
    console.log(req.session);
    var user_id = req.session.user.id;
    //var user_id = 31;
    //if (user_id == 'undefined') return res.send({success:false,message:'用户不存在'});

    req.db.driver.execQuery(yanzhi, [user_id], function (err, yanzhi) {
        if (err) return res.send({success: false, message: err});
        console.log(yanzhi);
        if (yanzhi.length > 0) {
            if (!yanzhi[0].user_id) return res.send({success: false, message: '用户不存在'});
            if (!yanzhi[0].yanzhi) yanzhi[0].yanzhi = 0;
            req.db.driver.execQuery(jifen, [user_id, user_id], function (err, jifen) {
                if (err) return res.send({success: false, message: err});
                if (jifen.length > 0) yanzhi[0].jifen = jifen[0].point; else yanzhi[0].jifen = 0;
                return res.send({success: true, message: yanzhi[0]});
                //查询图片数组//10条最新照片

                //req.models.Photo.count({user_id: user_id, activity: true, state: [0, 1]}, function (err, count) {
                //    if (err) return res.send({success: false, message: err});
                //    req.models.Photo.find({user_id: user_id, activity: true, state: [0, 1]})
                //        .limit(10)
                //        .offset(0)
                //        .orderRaw('date desc')
                //        .run(function (err, stores) {
                //            if (err) return res.send({success: false, message: err});
                //            yanzhi[0].total = count;
                //            yanzhi[0].data = stores;
                //            return res.send({success: true, message: yanzhi[0]});
                //        });
                //});



            });
        } else {
            res.send({success: false, message: '服务器忙'});
        }
    })
});


router.get('/friendinfo/:id', function (req, res) {
    //if (!req.session.user || !req.session.user.id) {
    //    return res.send({success: false, message: '请登录'});
    //}

    if (!oauth.oauth(req)) {
        return res.send({success: false, message: '请登录'});
    }
    var user_id = req.params.id;
    //var user_id = 31;


    req.db.driver.execQuery(yanzhi, [user_id], function (err, yanzhi) {
        if (err) return res.send({success: false, message: err});
        console.log(yanzhi);
        if (yanzhi.length > 0) {
            if (!yanzhi[0].user_id) return res.send({success: false, message: '用户不存在'});
            if (!yanzhi[0].yanzhi) yanzhi[0].yanzhi = 0;
            req.db.driver.execQuery(jifen, [user_id, user_id], function (err, jifen) {
                if (err) return res.send({success: false, message: err});
                if (jifen.length > 0) yanzhi[0].jifen = jifen[0].point; else yanzhi[0].jifen = 0;
                return res.send({success: true, message: yanzhi[0]});
                //查询图片数组//10条最新照片

                //req.models.Photo.count({user_id: user_id, activity: true, state: [0, 1]}, function (err, count) {
                //    if (err) return res.send({success: false, message: err});
                //    req.models.Photo.find({user_id: user_id, activity: true, state: [0, 1]})
                //        .limit(10)
                //        .offset(0)
                //        .orderRaw('date desc')
                //        .run(function (err, stores) {
                //            if (err) return res.send({success: false, message: err});
                //            yanzhi[0].total = count;
                //            yanzhi[0].data = stores;
                //            return res.send({success: true, message: yanzhi[0]});
                //        });
                //});



            });
        } else {
            res.send({success: false, message: '服务器忙'});
        }
    })






    //
    //if (user_id == 'undefined') return res.send({success: false, message: '用户不存在'});
    //
    //req.db.driver.execQuery(yanzhi, [user_id], function (err, yanzhi) {
    //    if (err) return res.send({success: false, message: err});
    //    console.log(yanzhi);
    //    if (yanzhi.length > 0) {
    //        if (!yanzhi[0].user_id) return res.send({success: false, message: '用户不存在'});
    //        if (!yanzhi[0].yanzhi) yanzhi[0].yanzhi = 0;
    //        req.db.driver.execQuery(jifen, [user_id, user_id], function (err, jifen) {
    //            if (err) return res.send({success: false, message: err});
    //            if (jifen.length > 0) yanzhi[0].jifen = jifen[0].point; else yanzhi[0].jifen = 0;
    //            return res.send({success: true, message: yanzhi[0]});
    //        })
    //    } else {
    //        res.send({success: false, message: '服务器忙'});
    //    }
    //})
});

//router.get('/ws_token', function (req, res) {
//    if (!oauth.oauth(req)) {
//        return res.send({success: false, message: '请登录'});
//    }
//
//
//    var id = req.session.user.id;
//    req.models.UserTooken.find({user_id: id}, function (err, tookenInfo) {
//        if (err) return res.send({success: false, message: err});
//        if (tookenInfo.length > 0) {
//            console.log(tookenInfo);
//            if (new Date() - tookenInfo[0].date > 1000 * 60) {
//                tookenInfo[0].token = id + ':' + uuid.v4();
//                tookenInfo[0].date = new Date();
//                tookenInfo[0].save(function (err) {
//                    if (err) return res.send({message: false, message: err});
//                    res.send({success: true, message: tookenInfo[0]});
//                });
//            } else {
//                res.send({success: true, message: tookenInfo[0]})
//            }
//        } else {
//            var data = {user_id: id, date: new Date(), tooken: id + ':' + uuid.v4()};
//            console.log(data);
//            req.models.UserTooken.create(data, function (err, tookenInfo2) {
//                if (err) return res.send({success: false, message: err});
//                console.log(tookenInfo2);
//                res.send({success: true, message: tookenInfo2});
//            });
//        }
//    });
//});


router.get('/ws_token', function (req, res) {
    if (!oauth.oauth(req)) {
        return res.send({success: false, message: '请登录'});
    }
    var id = req.session.user.id;
    //var id = req.params.id;
    console.log(id);
    req.models.UserTooken.find({user_id: id}, function (err, tookenInfo) {
        if (err) return res.send({success: false, message: err});
        if (tookenInfo.length > 0) {
            console.log(tookenInfo);
            if (new Date() - tookenInfo[0].date > 1000 * 60) {
                tookenInfo[0].token = id + ':' + uuid.v4();
                tookenInfo[0].date = new Date();
                tookenInfo[0].save(function (err) {
                    if (err) return res.send({message: false, message: err});
                    res.send({success: true, message: tookenInfo[0]});
                });
            } else {
                res.send({success: true, message: tookenInfo[0]})
            }
        } else {
            var data = {user_id: id, date: new Date(), token: id + ':' + uuid.v4()};
            console.log(data);
            req.models.UserTooken.create(data, function (err, tookenInfo2) {
                if (err) return res.send({success: false, message: err});
                console.log(tookenInfo2);
                res.send({success: true, message: tookenInfo2});
            });
        }
    });
});

//
//function yanzhi(db,user_id,cb){
//
//    req.db.driver.execQuery(yanzhi,[user_id],function (err,yanzhi) {
//        if (err) return res.send({success:false,message:err});
//        if (yanzhi.length>0){
//            db.driver.execQuery(jifen,[user_id,user_id], function (err, jifen) {
//                if (err) return res.send({success:false,message:err});
//                    if (jifen.length>0) yanzhi[0].jifen = jifen[0].jifen;
//                return res.send({success:true,message:yanzhi});
//            })
//        } else {
//            res.send({success:false,message:'服务器忙'});
//        }
//    })
//
//}

//var yanzhi = 'select user_info.*,sum(good)*5 as yanzhi' +
//    ' from photo,user_info' +
//    ' where user_info.user_id = photo.user_id and user_info.user_id = ? group by user_id' +
//    ' order by yanzhi';
//
//var jifen = 'select user_idsum(point) as jifen from ('+
//    '(select user_info.user_id,count(*)*20 as point from user_info,photo where user_info.user_id = photo.user_id and user_info.user_id = ? group by user_id)'+
//'union all'+
//'(select user_info.user_id,point from user_info,photo_good where user_info.user_id = photo_good.user_id and user_info.user_id = ?)'+
//')a group by user_id';

//router.post('/icon', function (req, res) {
//    if (!req.session.user || !req.session.user.id) {
//        return res.send({success: false, message: '请登录'});
//    }
//    var id = req.session.user.id;
//    var file = req.body.file;
//    if (!file) return res
//    var fileName = 'icon/' + Math.floor(Math.random() * 10000).toString(36) + new Date().getTime().toString(36) + '.jpg';
//    my_util.base64_decode(file, './public/file/download/' + fileName);
//
//
//    res.send({success: true, message: fileName});
//
//});

function getTooken(req, res) {

}


//router.get('/msg/:id', function (req,res) {
//    //按时间逆序取出聊天消息
//    if (!req.session.user || !req.session.user.id) {
//        return res.send({success: false, message: '请登录'});
//    }
//    var p = url.parse(req.url, true).query;
//
//    //if (!p.page) p.page = 1;
//    //if (!p.limit) p.limit = 10;
//
//
//    var id = req.session.user.id;
//    var otherId = req.params.id;
//    req.models.find()
//        .where('from_id=? and to_id=? or from_id=? and to_id=?',[id,otherId,otherId,id])
//        //.limit(p.limit*1)
//        //.offset((p.page - 1) * p.limit)
//        .run(function(err,msgs) {
//            if (err) {
//                return res.send({success:false,message:err});
//            }
//            return res.send({success:true,message:msgs});
//    });
//
//});

module.exports = router;

function userInfo(req, action, text) {
    var data = {
        user_id: req.session.user.id,
        action: action
    };

    if (text) {
        data.text = getClientIp(req) + text;
    } else {
        data.text = getClientIp(req);
    }

    req.models.UserLog.create(data, function (err, info) {
        if (err) console.log('login info' + err);
    });
}

function getClientIp(req) {
    var ipAddress;
    var forwardedIpsStr = req.header('x-forwarded-for');
    if (forwardedIpsStr) {
        var forwardedIps = forwardedIpsStr.split(',');
        ipAddress = forwardedIps[0];
    }
    if (!ipAddress) {
        ipAddress = req.connection.remoteAddress;
    }
    return 'ip:' + ipAddress;
}

function authentication(res, req) {
    if (!req.session.user || !req.session.user.id) {
        console.log('未记录');
        return;
    }
}

function JSONP(res, req, data) {
    var parmas = url.parse(req.url, true).query;
    res.send(parmas.callback + '(' + JSON.stringify(data) + ')');
}

function sendMSG(mobile, code, res, type) {
    console.log(code);
    //my_util.sendLoginCode(mobile,code,function (err,msg){
    //    if (err) return res.send({success:false,message:err})
    //    res.send({success:true,message:code,msg:'已经向'+ mobile +'发送验证码'});
    //})
    if (type == 1) {
        // 修改手机号
    } else {
        //注册
    }
    res.send({success: true, message: code});
}

function getStar(date) {
    var month = date.getMonth()+1;
    var day = date.getDate();
    var s="魔羯水瓶双鱼白羊金牛双子巨蟹狮子处女天秤天蝎射手魔羯";
    var arr=[20,19,21,20,21,22,23,23,23,24,23,22];
    return s.substr(month*2-(day<arr[month-1]?2:0),2) + "座";
}