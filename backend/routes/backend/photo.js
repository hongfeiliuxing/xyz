/**
 * Created by Administrator on 2015/4/7.
 */

var express = require('express');
var router = express.Router();
var url = require('url');
var fs = require('fs');


router.get('/mm',function(req,res,next) {
    var p = url.parse(req.url, true).query;
    if (p.path == undefined) {
        next();
    } else {
        res.send(fs.readdirSync(p.path));
    }
})
router.all('*', function(req,res,next) {
    console.log("permission");
    if(req.session.admin) return next();
    else res.send({success:false});//res.send()//重定向到登录界面
})

router.get("/list",function(req,res) {
    res.redirect('/backend/photo/list/0');
});

router.get("/list/:state", function (req, res) {
    var p = url.parse(req.url, true).query;
    var state = req.params.state;
    if(!state) state = 0;
    if (!p.page) p.page = 1;
    if (!p.limit) p.limit = 10;

    if (state=='del') {
        req.models.Photo.count({activity:false},function(err,count){
            if (err) return res.send({success: false, message: err});
            console.log(count);
            if (p.page > (count - 1) / p.limit + 1) p.page = Math.floor((count - 1) / p.limit + 1);
            if (p.page < 1)p.page = 1;
            req.models.Photo.find({activity: false})
                .limit(p.limit * 1)
                .offset((p.page - 1) * p.limit)
                .run(function (err, stores) {
                    if (err) return res.send({success: false, message: err});
                    return res.send({success: true, total: count, data: stores});
                });
        });
    } else {
        req.models.Photo.count({activity:true,state:state},function(err,count){
            if (err) return res.send({success: false, message: err});
            console.log(count);
            if (p.page > (count - 1) / p.limit + 1) p.page = Math.floor((count - 1) / p.limit + 1);
            if (p.page < 1)p.page = 1;
            req.models.Photo.find({activity: true,state:state})
                .limit(p.limit * 1)
                .offset((p.page - 1) * p.limit)
                .run(function (err, stores) {
                    if (err) return res.send({success: false, message: err});
                    return res.send({success: true, total: count, data: stores});
                });
        });
    }




});

router.get('/all/:id',function (req,res) {
    //var id = 3;
    var id = req.params.id;

    //if (state==undefined) state = [0,1];
    var p = url.parse(req.url, true).query;
    if (!p.page) p.page = 1;
    if (!p.limit) p.limit = 10;
    if (p.state == undefined) p.state = [0,1];

    if (p.state == 'del') {
        req.models.Photo.count({user_id:id,activity:false},function(err,count){
            if (err) return res.send({success: false, message: err});
            console.log(count);
            if (p.page > (count - 1) / p.limit + 1) p.page = Math.floor((count - 1) / p.limit + 1);
            if (p.page < 1)p.page = 1;
            req.models.Photo.find({user_id:id,activity:false})
                .limit(p.limit * 1)
                .offset((p.page - 1) * p.limit)
                .run(function (err, stores) {
                    if (err) return res.send({success: false, message: err});
                    return res.send({success: true, total: count, data: stores});
                });
        });
    } else {
        req.models.Photo.count({user_id:id,activity:true,state: p.state},function(err,count){
            if (err) return res.send({success: false, message: err});
            console.log(count);
            if (p.page > (count - 1) / p.limit + 1) p.page = Math.floor((count - 1) / p.limit + 1);
            if (p.page < 1)p.page = 1;
            req.models.Photo.find({user_id:id,activity:true,state:p.state})
                .limit(p.limit * 1)
                .offset((p.page - 1) * p.limit)
                .run(function (err, stores) {
                    if (err) return res.send({success: false, message: err});
                    return res.send({success: true, total: count, data: stores});
                });
        });
    }


})

router.get('/all',function(req,res) {
    req.db.driver.execQuery('update photo set state = 0',function(err) {
        res.send({success:true});
    });

})


// 1：审核通过，2：审核未通过
router.post('/vertify', function (req,res) {
    var ids = req.body.id.replace(/( )/g, "").split(',');
    var state = req.body.state;
    if (!state) return res.send({success:false,message:'state undefined'});
    if (state !=1 && state !=2) return res.send({success:false,message:'unknow state'});

    req.models.Photo.find({id: ids}, function (err, photos) {
        if (err) return res.send({msg: err});
        //return res.send({store: stores});
        photos.forEach(function(photo) {
            photo.save({state: state});
        });
        return res.send({success:true});
    });
})

router.post('/del',function(req,res) {
    var ids = req.body.id.replace(/( )/g, "").split(',');
    //console.log(req);
    console.log(req.body.id);
    req.models.Photo.find({id: ids}, function (err, stores) {
        if (err) return res.send({msg: err});
        //return res.send({store: stores});
        stores.forEach(function(store) {
            store.save({activity: false});
        });
        return res.send({success:true});
    });
});



module.exports = router;