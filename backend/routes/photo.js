/**
 * Created by Administrator on 2015/4/1.
 */

var express = require('express');
var router = express.Router();
var url = require('url');
var my_util = require('./my-util');
var oauth = require('./oauth');
var stringFormat = require('stringformat');
//var fs = require('fs');

//var md5 = require('MD5');
//var uuid = require('node-uuid');

/* GET users listing. */


//router.post('/add', function (req, res) {
//    //var fileName = req.files.file.name;
//    console.log(req.body);
//    var input = req.body;
//    if (!req.session.user || !req.session.user.id) {
//        return res.send({success: false, message: '请登录'});
//    }
//
//    var id = req.session.user.id;
//    //if (fileName) input.url = fileName;
//    var data = {user_id: id};
//    if (!input.file) return res.send({success: false, message: 'file 不能为空'});
//    var fileName = my_util.base64_decode(input.file, '/');
//
//    if (input.url) data.url = fileName;
//    //检测文件是否存在
//    //fs.exists('./public/file/download/' + data.url, function (exists) {
//    //    if (exists) {
//    req.models.Photo.create(data, function (err, photo) {
//        if (err) res.send({success: false, message: err});
//        res.send({success: true});
//    });
//    //    } else {
//    //        res.send({success: false, message: '文件不存在'});
//    //    }
//    //});
//
//    //req.send({success:true});
//    //req.models.Photo.create(data);
//
//});


router.post('/add', function (req, res) {

    if (!oauth.oauth(req)) {
        return res.send({success: false, message: '请登录'});
    }
    var id = req.session.user.id;
    var input = req.body;
    var data = {user_id: id};

    if (!input.file) return res.send({success: false, message: 'file 不能为空'});
    var fileName = my_util.base64_decode(input.file, '');
    data.url = fileName;

    req.models.Photo.create(data, function (err, photo) {
        if (err) return res.send({success: false, message: err});
        //修改照片墙的id
        req.models.UserInfo.find({user_id: id}, function (err, userInfos) {
            if (err) return res.send({success: false, message: err});
            if (userInfos.length > 0) {
                userInfos[0].fav_photo_id = photo.id;
                userInfos[0].save(function (err) {
                    if (err) return res.send({success: false, message: err});
                    res.send({success: true, message: photo});
                })
            }
        });
    });
});

router.get('/del/:id', function (req, res) {
    if (!oauth.oauth(req)) {
        return res.send({success: false, message: '请登录'});
    }
    var id = req.session.user.id;
    var photo_id = req.params.id;
    req.models.Photo.get(photo_id, function (err, photo) {
        if (err) return res.send({success: false, message: err});
        if (id != photo.user_id) return res.send({success:false,message:'你正在试图删除不属于你的照片'});
        photo.save({activity: false},function(err) {
            if (err) res.send({success:false,message:err});
            res.send({success: true});
        });

    })
})

router.get("/info/:id", function (req, res) {
    if (!oauth.oauth(req)) {
        return res.send({success: false, message: '请登录'});
    }
    var id = req.session.user.id;
    var photo_id = req.params.id;
    req.models.Photo.get(photo_id, function (err, photo) {
        if (err) return res.send({success: false, message: err});
        if (id != photo.user_id) return res.send({success:false,message:'你试图查看一张不属于你的照片'});
        res.send({success: true, message: photo});
    })
});

router.get('/all', function (req, res) {
    //var id = 3;
    if (!oauth.oauth(req)) {
        return res.send({success: false, message: '请登录'});
    }
    var id = req.session.user.id;
    var p = url.parse(req.url, true).query;
    if (!p.page) p.page = 1;
    if (!p.limit) p.limit = 10;

    req.models.Photo.count({user_id: id, activity: true, state: [0, 1]}, function (err, count) {
        if (err) return res.send({success: false, message: err});
        console.log(count);
        if (p.page > (count - 1) / p.limit + 1) p.page = Math.floor((count - 1) / p.limit + 1);
        if (p.page < 1)p.page = 1;
        req.models.Photo.find({user_id: id, activity: true, state: [0, 1]})
            .limit(p.limit * 1)
            .offset((p.page - 1) * p.limit)
            .orderRaw('date desc')
            .run(function (err, stores) {
                if (err) return res.send({success: false, message: err});
                return res.send({success: true, total: count, data: stores});
            });
    });
})


router.get('/friend_photo/:id', function (req, res) {
    //var id = 3;
    if (!oauth.oauth(req)) {
        return res.send({success: false, message: '请登录'});
    }
    var id = req.params.id;
    var p = url.parse(req.url, true).query;
    if (!p.page) p.page = 1;
    if (!p.limit) p.limit = 10;

    req.models.Photo.count({user_id: id, activity: true, state: [0, 1]}, function (err, count) {
        if (err) return res.send({success: false, message: err});
        console.log(count);
        if (p.page > (count - 1) / p.limit + 1) p.page = Math.floor((count - 1) / p.limit + 1);
        if (p.page < 1)p.page = 1;
        req.models.Photo.find({user_id: id, activity: true, state: [0, 1]})
            .limit(p.limit * 1)
            .offset((p.page - 1) * p.limit)
            .orderRaw('date desc')
            .run(function (err, stores) {
                if (err) return res.send({success: false, message: err});
                return res.send({success: true, total: count, data: stores});
            });
    });
})

router.get('/all_bygood', function (req, res) {
    //var id = 3;
    if (!oauth.oauth(req)) {
        return res.send({success: false, message: '请登录'});
    }
    var id = req.session.user.id;
    var p = url.parse(req.url, true).query;
    if (!p.page) p.page = 1;
    if (!p.limit) p.limit = 10;

    req.models.Photo.count({user_id: id, activity: true, state: [0, 1]}, function (err, count) {
        if (err) return res.send({success: false, message: err});
        console.log(count);
        if (p.page > (count - 1) / p.limit + 1) p.page = Math.floor((count - 1) / p.limit + 1);
        if (p.page < 1)p.page = 1;
        req.models.Photo.find({user_id: id, activity: true, state: [0, 1]})
            .limit(p.limit * 1)
            .offset((p.page - 1) * p.limit)
            .orderRaw('good desc,date desc')
            .run(function (err, stores) {
                if (err) return res.send({success: false, message: err});
                return res.send({success: true, total: count, data: stores});
            });
    });
})

var sqlPhotoWall = 'select * from (select user_info.fav_photo_id as photo_id,user_info.user_id,user_info.nickname,user_info.icon,url,photo.good as count from photo,user_info where user_info.user_id = photo.user_id order by rand() limit 0,1000) as a group by user_id order by rand() limit 20';
var sqlPhotoWall2 = 'select a.id as photo_id,sex,user_info.user_id,user_info.nickname,user_info.icon,url,a.good as count from photo a,user_info where a.state != 2 and a.activity = 1 and{0} user_info.user_id = a.user_id and 5>(select count(*) from photo where user_id=a.user_id and id>a.id) order by rand() limit 0,10';
//var sqlPhotoWall_boy = 'select a.id as photo_id,sex,user_info.user_id,user_info.nickname,user_info.icon,url,a.good as count from photo a,user_info where a.state != 2 and a.activity = 1 and sex = 1 and user_info.user_id = a.user_id and 5>(select count(*) from photo where user_id=a.user_id and id>a.id) order by rand() limit 0,10';
//var sqlPhotoWall_girl = 'select a.id as photo_id,sex,user_info.user_id,user_info.nickname,user_info.icon,url,a.good as count from photo a,user_info where a.state != 2 and a.activity = 1 and sex = 0 and user_info.user_id = a.user_id and 5>(select count(*) from photo where user_id=a.user_id and id>a.id) order by rand() limit 0,10';
//'SELECT user_info.fav_photo_id as photo_id,user_info.user_id,user_info.nickname,user_info.icon,url,photo.good as count,photo_good.good as isGood' +
//' FROM (user_info,photo) left join photo_good' +
//' ON photo_id = user_info.fav_photo_id AND user_info.user_id = photo_good.user_id' +
//' where fav_photo_id=photo.id AND fav_photo_id is not null order by rand() limit 0, 10'

router.get("/list", function (req, res) {
    var p = url.parse(req.url, true).query;
    var sql;
    if(p.sex == 'girl') {
        //sql = sqlPhotoWall_girl;
        sql = stringFormat(sqlPhotoWall2,' sex=0 and')
    } else if (p.sex == 'boy') {
        //sql = sqlPhotoWall_boy;
        sql = stringFormat(sqlPhotoWall2,' sex=1 and');
    } else {
        sql = stringFormat(sqlPhotoWall2,'');
    }
    //存在缓存问题
    req.db.driver.execQuery(sql,
        //[id, (p.page - 1) * p.limit, p.limit * 1],
        function (err, data) {
            if (err) res.send({success: false, message: err});
            res.send({success: true, data: data});
        });
});


//router.get('/isGood',function(req,res) {
//    var input = req.body;
//    console.log(input);
//    console.log(req.query.params);
//    var id = input.user_id;
//    var photo_id = input.photo_id;
//    if (!id || !photo_id) return  res.send({success:false,message:'user_id or photo_id 不能为空'});
//    req.models.PhotoGood.find({user_id:id,photo_id:photo_id},function(err, photo_goods) {
//        if(err) return res.send({success:false,message:err});
//        return photo_goods>0 && photo_goods.good == true;
//    })
//});
//
router.post('/isGood/:id', function (req, res) {
    if (!oauth.oauth(req)) {
        return res.send({success: false, message: '请登录'});
    }
    var id = req.session.user.id;
    var input = req.body;
    //console.log(input);
    //console.log(req.query.params);
    //var id = input.user_id;
    var photo_id = req.params.id;
    //var photo_id = input.photo_id;
    if (!id || !photo_id) return res.send({success: false, message: 'photo_id 不能为空'});
    req.models.PhotoGood.find({user_id: id, photo_id: photo_id}, function (err, photo_goods) {
        if (err) return res.send({success: false, message: err});
        //console.log({success:photo_goods.length>0 && photo_goods[0].good == true});
        return res.send({success: true, message: {isGood: photo_goods.length > 0 && photo_goods[0].good == true}});
    })
});

router.post('/good/:id', function (req, res) {
    if (!oauth.oauth(req)) {
        return res.send({success: false, message: '请登录'});
    }
    var id = req.session.user.id;
    //var id = req.body.user_id;
    //if (!id) return res.send({success: false, message: 'user_id 不能为空'});
    //var photoId = req.params.id * 1;
    var photoId = req.params.id;
    req.db.transaction(function (err, t) {


        if (err) return res.send({success: false, message: err});
        req.models.Photo.get(photoId, function (err, photo) {
            if (err) {
                res.send({success: false, message: err});
            } else {
                req.models.PhotoGood.find({user_id: id, photo_id: photoId}, function (err, photoGoods) {
                    if (err) return res.send({success: false, message: err});
                    if (photoGoods.length > 0) {
                        return res.send({success: false, message: '不能重复点赞'});//已点赞，但是总数不增加
                    } else {
                        //计算本次点赞积分
                        req.db.driver.execQuery('select count(*) as count from photo_good where user_id = ? and date>?',
                            [3, new Date().toLocaleDateString()],
                            function (err, count) {
                                if (err) return res.send({success: false, message: err});
                                var point = 5;
                                count = count[0].count;
                                if (count < 11) point = 10; else if (count < 21) point = 8; else point = 5;
                                req.models.PhotoGood.create({user_id: id, photo_id: photoId, good: true, point: point},
                                    function (err, photoGood) {
                                        if (err) return res.send({success: false, message: err});
                                        photo.good = (photo.good || 0) + 1;
                                        photo.save(function (err) {
                                            if (err)return res.send({success: false, message: err});
                                            return res.send({success: true});
                                        });
                                    });
                            })
                    }
                });
            }
        });

        t.commit(function (err) {
            //console.log('commit');
            if (err) console.log(err);
        });

    });

});

// 获取颜值榜

//判断照片是否被删除

var yanzhibang = 'select user_info.user_id,nickname,star,icon,age,sum(good)*5 as yanzhi' +
    ' from photo,user_info' +
    ' where user_info.user_id = photo.user_id {0} group by user_id' +
    ' order by yanzhi desc limit 0,20';

var yanzhibang2 = 'select photo.user_id,nickname,star,icon,age,count(*)*5 as yanzhi' +
    ' from user_info,photo,photo_good' +
    ' where user_info.user_id = photo.user_id and photo_good.photo_id = photo.id {0}' +
    ' group by photo.user_id order by yanzhi desc limit 0,20';

router.get('/yanzhibang', function (req, res) {
    //var state = req.params.state;
    //if (state != 'day' && state != 'week' && state != 'all') {
    //    return res.send({success:false,message:'only day/week/all'});
    //}
    var p = url.parse(req.url, true).query;
    var sql;
    if(p.sex == 'girl') {
        sql = stringFormat(yanzhibang,'and sex=0')
    } else if (p.sex == 'boy') {
        //sql = sqlPhotoWall_boy;
        sql = stringFormat(yanzhibang,'and sex=1');
    } else {
        sql = stringFormat(yanzhibang,'');
    }
    req.db.driver.execQuery(sql, function (err, yanzhi) {
        if (err) return res.send({success: false, message: err});
        res.send({success: true, message: yanzhi});
    });
});

router.get('/yanzhibang/:status', function (req, res) {
    var status = req.params.status;
    //var state = req.params.state;
    if (status != 'day' && status != 'week' && status != 'all') {
        return res.send({success:false,message:'only day/week/all'});
    }

    var p = url.parse(req.url, true).query;
    var sql;
    if(p.sex == 'girl') {
        sql = stringFormat(yanzhibang2,'and sex=0 {0} ')
    } else if (p.sex == 'boy') {
        //sql = sqlPhotoWall_boy;
        sql = stringFormat(yanzhibang2,'and sex=1 {0} ');
    } else {
        sql = stringFormat(yanzhibang2,' {0} ');
    }



    var yanzhiState = {
        all:'',
        day:'and photo_good.date > "' +new Date().toLocaleDateString()+'"',
        week:'and photo_good.date > "' +new Date(new Date() -7 *24*60*60*1000).toLocaleDateString()+'"',all:''};
    //if (status == 'all') {
    //    req.db.driver.execQuery(stringFormat(yanzhibang,''), function (err, yanzhi) {
    //        if (err) return res.send({success: false, message: err});
    //        res.send({success: true, message: yanzhi});
    //    });
    //} else {
    //    res.send(stringFormat(sql,yanzhiState[status]));
        req.db.driver.execQuery(stringFormat(sql,yanzhiState[status]),function(err,yanzhi) {

            if (err) return res.send({success: false, message: err});
            res.send({success: true, message: yanzhi});
        })
    //}
});

//router.get('/yanzhi/:id', function (req, res) {
//    var id = req.session.user.id;
//
//});


// 获取积分榜
var sqlJifenbang = 'select user_id,nickname,star,icon,age,sum(point) as jifen from (' +
    '(select user_info.user_id,nickname,star,icon,age,count(*)*20 as point from user_info,photo where photo.state != 2 and user_info.user_id = photo.user_id{0} group by user_id)' +
    'union all' +
    '(select user_info.user_id,nickname,star,icon,age,point from user_info,photo_good where user_info.user_id = photo_good.user_id{1})' +
    ')a group by user_id order by point desc limit 0,20';

//var jifenState = {day:['and photo.date > ' +new Date().toLocaleDateString() + " GMT+0800",'and photo_good.date > ' +new Date().toLocaleDateString() + " GMT+0800"],all:['','']};
router.get('/jifenbang/:status', function (req, res) {
    var status = req.params.status;
    if (status != 'day' && status != 'all') return res.send({success:false,message:'only day/all'});

    var p = url.parse(req.url, true).query;
    var sql;



    var jifenState = {day:[' and photo.date > "' +new Date().toLocaleDateString()+'" {0} ',' and photo_good.date > "' +new Date().toLocaleDateString()+'" {0} '],all:[' {0} ',' {0} ']};

    sql = stringFormat(sqlJifenbang,jifenState[status][0],jifenState[status][1]);

    if(p.sex == 'girl') {
        sql = stringFormat(sql,'and sex=0')
    } else if (p.sex == 'boy') {
        //sql = sqlPhotoWall_boy;
        sql = stringFormat(sql,'and sex=1');
    } else {
        sql = stringFormat(sql,'');
    }

    //console.log(stringFormat(sqlJifenbang,jifenState[status][0],jifenState[status][1]));
    //res.send(stringFormat(sqlJifenbang,jifenState[status][0],jifenState[status][1]));
    req.db.driver.execQuery(sql, function (err, jifen) {
        if (err) return res.send({success: false, message: err});
        res.send({success: true, message: jifen});
    })
});


//
//router.post('/notgood/:id', function (req, res) {
//    if (!req.session.user || !req.session.user.id) {
//        return res.send({success: false, message: '请登录'});
//    }
//
//    var id = req.session.user.id;
//    var photoId = req.params.id*1;
//    req.db.transaction(function (err, t) {
//
//
//        if (err) return res.send({success: false, message: err});
//        req.models.Photo.get(photoId, function (err, photo) {
//            if (err) {
//                res.send({success: false, message: err});
//            } else {
//                req.models.PhotoGood.find({user_id: id, photo_id: photoId}, function (err, photoGoods) {
//                    if (err) return res.send({success: false, message: err});
//                    if (photoGoods.length > 0) {
//                        return res.send({success: true});//已点赞，但是总数不增加
//                        //取消点赞
//                        photoGoods[0].remove(function(err) {
//                            if (err) return res.send({success:false,message:err});
//                            photo.good = photo.good || 0 + 1;
//                            if (photo.good<0) photo.good = 0;
//                            photo.save(function (err) {
//                                if (err)return res.send({success: false, message: err});
//                                return res.send({success: true});
//                            });
//                        });
//                    } else {
//                       res.send({success:true});
//                    }
//                });
//            }
//        });
//
//        t.commit(function (err) {
//            //console.log('commit');
//            if (err) console.log(err);
//        });
//
//    });
//});
//
//router.post('/icon',function(req,res) {
//    if (!req.session.user || !req.session.user.id) {
//        return res.send({success: false, message: '请登录'});
//    }
//    var id = req.session.user.id;
//    var file = req.body.file;
//    if (!file) return res
//    var fileName = 'icon/' + Math.floor(Math.random()*10000).toString(36) + new Date().getTime().toString(36) + '.jpg';
//    my_util.base64_decode(file,'./public/file/download/' +fileName);
//
//
//    res.send({success:true,message:fileName});
//
//});

//SELECT user_info.fav_photo_id,user_info.fav_photo_url,photo_good.good FROM (user_info,photo) left join photo_good ON photo_id = user_info.fav_photo_id AND user_info.fav_photo_id = photo_good.photo_id where fav_photo_id=photo.id AND fav_photo_id is not null
//SELECT photo.user_id, url,user_info.fav_photo,photo.good FROM (user_info,photo WHERE photo.id = user_info.fav_photo_id AND photo.id = photo_good.photo_id) left join photo_good ON photo_good.user_id = user_info.user_in order by photo.good
//AND photo_good.user_id = photo.user_id  photo.user_id, url,user_info.fav_photo,photo.good
module.exports = router;


// function to encode file data to base64 encoded string

// convert image to base64 encoded string
//var base64str = base64_encode('kitten.jpg');
//console.log(base64str);
// convert base64 string back to image
//base64_decode(base64str, 'copy.jpg');