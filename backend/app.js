var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var orm = require('orm');
var transaction = require('orm-transaction');
var mysql = require('mysql');

var stringFormat = require('stringformat');
var sqlModel = require('./sqlModel');

//var routes = require('./routes/index');
var users = require('./routes/users');
var photo = require('./routes/photo');

var download = require('./routes/fileServer');
//backend
var backendUser = require('./routes/backend/users');
var store = require('./routes/backend/store');
var judgePhoto = require('./routes/backend/photo');

var app = express();

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json({limit:'50mb'}));
app.use(bodyParser.urlencoded({extended: false,limit:'50mb'}));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '../public/')));
app.use(session({
    secret: 'keyboard cat',
    resave: true,//true 每次重写cookie
    saveUninitialized: true,
    cookie: {maxAge: 6000000}
}));


//use mysql
//DB config
global.db_config = {
    host: 'localhost',
    user: 'root',
    password: 'Paiwode168',
    port: 3306, //port mysql
    database: 'xiuyanzhi'
};

global.db_config_format = stringFormat("mysql://{0}:{1}@{2}/{3}",
    global.db_config.user,
    global.db_config.password,
    global.db_config.host,
    global.db_config.database);


app.use(orm.express(global.db_config_format, {
    define: function (db, models, next) {
        sqlModel(db, models);
        db.use(transaction);
        next();
    }
}));



//所有的链接都需要验证请求头

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With,content-type");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});
//app.use(app.limit(1024*1024*20));
app.use('/file',download);
app.use('/photo',photo);
app.use('/backend/user',backendUser);
app.use('/backend/store', store);
app.use('/backend/photo',judgePhoto);
app.use('/user', users);
//app.use('/', routes);

app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.send({success:false,message:err.message,error:err});
        //res.render('error', {
        //    message: err.message,
        //    error: err
        //});
    });
}

app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send({success:false,message:err.message,error:err});
    //res.render('error', {
    //    message: err.message,
    //    error: {}
    //});
});

module.exports = app;


function authentication(req, res, next) {
    if (!req.session.user) {
        req.session.error = '请先登陆';
        return res.redirect('/');
    }
    next();
}

function notAuthentication(req, res, next) {
    if (req.session.user) {
        req.session.error = '已登陆';
        return res.redirect('/');
    }
    next();
}