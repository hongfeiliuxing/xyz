/**
 * Created by Administrator on 2015/3/26.
 */

var express = require('express');
var router = express.Router();
var md5 = require('MD5');
var url = require('url');

router.all('*', function(req,res,next) {
    console.log("permission");
    if(req.session.admin) return next();
    else res.send({success:false});//res.send()//重定向到登录界面
})

router.post('/add', function (req, res) {
    var input = JSON.parse(JSON.stringify(req.body));
    var data = {
        name: input.name,
        type: input.type,//默认 bar
        gps_lat: input.gps_lat,
        gps_lan: input.gps_lon,//精度
        contact: input.contact,//联系人姓名：店主姓名
        mobile: input.mobile,
        address:input.address
    };

    req.models.Store.create(data, function (err, store) {
        if (err) {
            return res.send({success: false, message: err});
        } else {
            res.send({success: true, message: store});
        }
    });

});

router.post('/edit/:id', function (req, res) {
    var input = JSON.parse(JSON.stringify(req.body));
    var id = req.params.id;
    var data = {
        name: input.name,
        type: input.type,//默认 bar
        gps_lat: input.lat,
        gps_lon: input.lon,
        contact: input.contact,//联系人姓名：店主姓名
        address: input.address,
        mobile: input.mobile
    };

    req.models.Store.get(id, function (err, store) {
        if (err) return res.send({success: false, message: err});
        store.save(data, function (err) {
            if (err) return res.send({success: false, message: err});
            res.send({success: true});
        });
    });
});

router.post('/del/', function (req, res) {
    var ids = req.body.id.replace(/( )/g, "").split(',');
    //console.log(req);
    req.models.Store.find({id: ids}, function (err, stores) {
        if (err) return res.send({msg: err});
        //return res.send({store: stores});
        stores.forEach(function(store) {
            store.save({activity: false});
        });
        return res.send({success:true});
    });
    //return res.send(req.body);
});

router.get('/all',function(req,res) {
    //var ids = req.body.id;
    req.models.Store.find({}, function (err, stores) {
        if (err) return res.send({msg: err});
        //return res.send({store: stores});
        stores.forEach(function(store) {
            store.save({activity: true});
        });
        return res.send({success:true});
    });
});

router.post('/del/:id', function (req, res) {
    var id = req.params.id;
    console.log(id);
    req.models.Store.get(id, function (err, store) {
        store.save({activity: false}, function (err) {
            if (err) return res.send({success: false, message: err});
            res.send({success: true});
        })
    })
});


router.get('/info/:id', function (req, res) {
    var id = req.params.id;
    req.models.Store.get(id, function (err, store) {
        if (err) return res.send({success: false, message: err});
        return res.send({success: true, message: store});
    });
});

router.get('/list', function (req, res) {

    var p = url.parse(req.url, true).query;

    if (!p.page) p.page = 1;
    if (!p.limit) p.limit = 10;

    req.models.Store.count({activity: true}, function (err, count) {
        if (err) return res.send({success: false, message: err});
        console.log(count);
        if (p.page > (count - 1) / p.limit + 1) p.page = Math.floor((count - 1) / p.limit + 1);
        if (p.page < 1)p.page = 1;
        //,{offset:(p.page - 1) * p.limit,limit:p.limit}
        console.log((p.page - 1) * p.limit);
        req.models.Store.find({activity: true})
            .limit(p.limit * 1)
            .offset((p.page - 1) * p.limit)
            .run(function (err, stores) {
                if (err) return res.send({success: false, message: err});
                return res.send({success: true, total: count, data: stores});
            });
    });

});

router.get('/search',function(req, res) {
    //username
    var p = url.parse(req.url, true).query;
    if (!p.name) return res.send({success:true,message:[]});
    p.name = '%'+ p.name + '%';

    req.models.Store.find({activity:true}).where('name like ?',[p.name]).run(function(err, stores) {
        if (err) return res.send({success:false,message:err});
        return res.send({success:true,total:stores.length, data:stores});
    });

});


module.exports = router;