/**
 * Created by Administrator on 2015/3/30.
 */

module.exports = function (db, models) {
    models.User = db.define('user', {
        password: String,
        username: String,
        mobile: String,
        wechat_id: String
    });

    models.UserInfo = models.User.extendsTo('info', {
        nickname: String,
        sex: Boolean,
        age: {type: 'number', rational: false},
        birthday:{type:'date',time:false},
        height: {type: 'number', rational: false},
        star: String,
        icon: String,
        area: String,
        sign: String,
        fav_photo_id: {type: 'number', rational: false},
        fav_photo_url: String,
        date: {type: 'date', time: true},
        updateDate: {type: 'date', time: true},
        lastLogin: {type: 'date', time: true}
    }, {
        hooks: {
            beforeCreate: function (next) {
                this.date = new Date();
                return next();
            }
        }
    });

    models.UserLog = models.User.extendsTo('log', {
        action: String,
        text: String,
        date: {type: 'date', time: true}
    }, {
        hooks: {
            beforeCreate: function (next) {
                this.date = new Date();
                return next();
            }
        }
    });

    models.UserAcount = models.User.extendsTo('account', {
        point: {type: 'number', rational: false},
        account: {type: 'number', rational: false}
    });

    models.UserPoints = db.define('user_points', {
        user_id: {required: 'NOT NULL', type: 'number', rational: false},
        point: {type: 'number', rational: false},
        date: {type: 'date', time: true},
        detail: String
    }, {
        hooks: {
            beforeCreate: function (next) {
                this.date = new Date();
                return next();
            }
        }
    });

    models.UserTooken = models.User.extendsTo('token', {
        token: String,
        date: {type: 'date', time: true}
    }, {
        cache: false
    });

    models.Photo = db.define('photo', {
        url: String,
        good: {type: 'number', rational: false},
        user_id: {required: 'NOT NULL', type: 'number', rational: false},
        activity: Boolean,
        state:{type: 'number', rational: false},
        date: {type: 'date', time: true}
    }, {
        hooks: {
            beforeCreate: function (next) {
                this.date = new Date();
                this.activity = true;
                this.good = 0;
                if (!this.state) this.state = 0;
                return next();
            }
        }
    });

    models.PhotoGood = db.define('photo_good', {
        user_id: {required: 'NOT NULL', type: 'number', rational: false},
        photo_id: {required: 'NOT NULL', type: 'number', rational: false},
        good: Boolean,
        point:{type: 'number', rational: false},
        date: {type: 'date', time: true},
        updateDate: {type: 'date', time: true}
    }, {
        hooks: {
            beforeCreate: function (next) {
                this.date = new Date();
                this.activity = true;
                return next();
            },
            beforeSave: function (next) {
                this.updateDate = new Date();
                return next();
            }
        }
    });

    models.Message = db.define('chat_message', {
        from_id: {required: 'NOT NULL', type: 'number', rational: false},
        to_id: {required: 'NOT NULL', type: 'number', rational: false},
        msg: String,
        hasRead: Boolean,
        date: {type: 'date', time: true}
    }, {
        hooks: {
            beforeCreate: function (next) {
                this.date = new Date();
                return next();
            }
        }
    });

    models.LastestMessage = db.define('last_msg',{
        user_id:{required: 'NOT NULL', type: 'number', rational: false},
        friend_id:{required: 'NOT NULL', type: 'number', rational: false},
        relation:{required: 'NOT NULL', type: 'number', rational: false},
        unReadCount:{required: 'NOT NULL', type: 'number', rational: false},
        msg_id:{required: 'NOT NULL', type: 'number', rational: false},
        date:{type: 'date', time: true},
        updateDate:{type: 'date', time: true}
    }, {
        hooks: {
            beforeCreate: function (next) {
                this.date = new Date();
                return next();
            },
            beforeSave: function(next) {
                this.updateDate = new Date();
                return next();
            }
        }

    });

    models.MobileCode = db.define('mobile_code',{
        mobile:String,
        code:String,
        type:{ type: 'number', rational: false},
        date:{type: 'date', time: true},
        count:{ type: 'number', rational: false}
    },{
        hooks: {
            beforeCreate: function (next) {
                this.date = new Date();
                return next();
            },
            beforeSave: function(next) {
                this.date = new Date();
                return next();
            }
        }
    });

    models.Store = db.define('store', {
        name: String,
        type: String,
        gps_lat: Number,
        gps_lon: Number,
        contact: String,
        mobile: String,
        address: String,
        activity: Boolean,
        date: {type: 'date', time: true},
        updateDate: {type: 'date', time: true}
    }, {
        hooks: {
            beforeCreate: function (next) {
                this.date = new Date();
                this.activity = true;
                return next();
            },

            beforeSave: function (next) {
                this.updateDate = new Date();
                return next();
            }
        }
    });

    models.User.sync(function (err) {
        if (err) console.log(err);
    });
    models.Photo.sync();
    models.PhotoGood.sync();
    models.UserTooken.sync();
    models.Message.sync();
    models.LastestMessage.sync();
    models.UserAcount.sync(function (err) {
        if (err) console.log(err);
    });
    models.UserInfo.sync(function (err) {
        if (err) console.log(err);
    });
    models.UserLog.sync(function (err) {
        if (err) console.log(err);
    });
    models.UserPoints.sync(function (err) {
        if (err) console.log(err);
    });
    models.Store.sync(function (err) {
        if (err) console.log(err);
    });
    models.MobileCode.sync();
}