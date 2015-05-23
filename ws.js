var ws = require("nodejs-websocket")
var orm = require('orm');
var sqlModel = require('./sqlModel');
var util = require('util');

var models = {};
var db = null;
var connections = [];
// Scream server example: "hi" -> "HI!!!"
orm.connect("mysql://root:Paiwode168@localhost:3306/xiuyanzhi", function (err, _db) {
    sqlModel(_db, models);
    //console.log(models);
    db = _db;
});

var server = ws.createServer(function (connection) {
    connection.id = 0;
    connection.name = null;
    connection.sendJSON = function (data) {
        //console.log(this);
        this.sendText(JSON.stringify(data));
    }

    connection.on("text", function (str) {
        console.log(str);
        var data;
        try {
            data = JSON.parse(str);
            switch (data.action) {
                case 'open':
                    open(data, connection);
                    break;
                case 'send':
                    send(data, connection);
                    break;
                case 'message_record':
                    getMessage(data, connection);
                    break;
                case 'message_list':
                    getMessageList(data, connection);
                    break;
                case 'message_record_test':
                    getMessageTest(data, connection);
                    break;
                case 'broadcast':
                    broadcast(data, connection);
                    break;
                case 'clear_unread':
                    clearUnrend(data,connection);
                    break;
                default :
                    connection.sendJSON({success:false,message:'未知的类型'})
            }
        } catch (e) {
            console.log(e);
            return connection.sendJSON({success: false, err: {code: 1, msg: e}});
        }


    })

    connection.on("error",function(err) {
        console.log(err);
    })

    connection.on("close", function () {
        //broadcast(connection.nickname + " left")
        connections[connection.id] = null;
        //删除connections存储，通知好友下线
    })
})

server.listen(3001);

function broadcast(str) {
    server.connections.forEach(function (connection) {
        connection.sendJSON(str)
    })
}

function clearUnrend(data,conn) {
    models.LastestMessage.find({user_id: conn.id, friend_id: data.user_id}, function (err, lastest_msg) {


        if (err) return conn.sendJSON({action:'clear_unread_back',success:false,message:err});
        console.log(lastest_msg)
        if (lastest_msg.length > 0) {
            if (lastest_msg[0].unReadCount==0) return;
            lastest_msg[0].save({
                unReadCount: 0
            }, function (err) {
                if (err) return conn.sendJSON({action:'clear_unread_back',success:false,message:err});
                conn.sendJSON({action:'clear_unread_back',success:true});
            });
        }
    });
}

// 帮助方法
/**
 * 获取好友列表
 */
function getFriendList(id, attr) {//
    //获取好友信息
    //models.Person.find({ surname: "Doe" }).limit(3).offset(2)
    // .only("name", "surname").run(function (err, people) {
    if (attr) {

    }
    return [{
        id: 1,
        name: zack,
        susciption: 'from'
    }, {
        id: 2,
        name: Lion,
        susciption: 'to'
    }, {
        id: 3,
        name: Jason,
        susciption: 'both'
    }];
}


// 登录失败目前没有 退出连接
/**
 *
 * @param option action:open
 *          JSON : tooken, username(暂无)
 * @return option
 *          JSON: {back:open,success:false,err:{code:1,msg:'无效tooken'}}
 */

function open(option, conn) {
    if (!option.token) return conn.sendJSON({action: 'open_back', success: false, err: {code: 101, msg: '无效token'}});

    models.UserTooken.find({token: option.token}, function (err, tookenInfo) {
        if (err) return conn.sendJSON({action: 'open_back', success: false, err: {code: 100, msg: err}});
        console.log(util.inspect(tookenInfo));
        if (tookenInfo.length > 0) {

            console.log(new Date() - tookenInfo[0].date);
            //检查tooken是否过期
            if (new Date() - tookenInfo[0].date > 1000 * 60 * 10) {
                return conn.sendJSON({action: 'open_back', success: false, err: {code: 102, msg: 'token 过期'}});
            }
            if (connections[tookenInfo[0].user_id]) {
                if (connections[tookenInfo[0].user_id] !== conn) //不是本身 关闭连接
                    connections[tookenInfo[0].user_id].sendJSON({action:'close',message:'在其他设备上登录'})
                    connections[tookenInfo[0].user_id].close();
            }
            connections[tookenInfo[0].user_id] = conn;
            conn.name = tookenInfo[0].name;
            conn.id = tookenInfo[0].user_id;
            conn.sendJSON({action: 'open_back', success: true});
            // 需要增加通知好友上线的处理

            //conn.close();

        } else {
            conn.sendJSON({action: 'open_back', success: false, err: {code: 102, msg: '无效的tooken'}});
        }

    });
}

/**
 *
 * @param option action:roser
 *          JSON : {back:roser,success:true,rosers:[
 *          {name:Andy,id:1,susciption:(from,to,both)}
 *          ]}
 * @param conn
 */

function getRoser(option, conn) {

}

/**
 *
 * @param option
 *          JSON :{back:..,success:true,msg:{
 *          type:(chat,groupchat),form:1,to:2,data:"",url:"abc.jpg",filename:"ssdf.jpg"
 *          }}
 * @param conn
 */
function onRoser(option, conn) {

}

function send(option, conn) {
    if (!conn.id) return conn.sendJSON({action: 'send_back', success: false, message: '请登录'});
    if (!option.to_id)return conn.sendJSON({action: 'send_back', success: false, message: '没有to_id'});
    option.from_id = conn.id;
    option.from_id = conn.id;
    if (option.to_id instanceof  Array) {
        if (option.to_id instanceof  Array) {
            option.to_id.forEach(function (to) {
                sendTo(option, to, conn, false);
            });
        }
    } else if (option.to_id) {
        sendTo(option, option.to_id, conn, true);
    } else {
        conn.sendJSON({action: 'send_back', success: false, message: 'to_id undefined'})
    }

}

function sendTo(option, to, conn, backInfo) {
    option.user_id = conn.id;

    if (!to) {
        if (backInfo) {
            conn.sendText(JSON.stringify({action: 'send_back', success: false, message: '用户不存在'}));
        }
        return;
    }
    if (connections[to]) {
        //connections[to].sendJSON(option);

        logMessage(option, function (err) {
            if (err) {
                conn.sendJSON({action: 'send_back', success: false, message: err});
                //connections[to].sendJSON({action: 'send_receive', success: true});
            } else {
                conn.sendJSON({action: 'send_back', success: true,data:{from_id:conn.id,to_id:to,msg:option.msg,date:new Date()}});
                connections[to].sendJSON({action: 'send_receive', success: true,data:{from_id:conn.id,to_id:to,msg:option.msg,date:new Date()}});
            }
        });
        return;
    }

    // 用户不在线,或用户不存在
    models.User.get(to, function (err, user) {
        if (err) return conn.JSON({action: 'send_back', success: false});
        if (user) {
            logMessage(option, function (err) {
                if (backInfo) {
                    if (err) {
                        console.log(err);
                        conn.sendJSON({action: 'send_back', success: false, message: err});
                    } else {
                        conn.sendJSON({action: 'send_back', success: true,data:{from_id:conn.id,to_id:to,msg:option.msg,date:new Date()}});
                    }
                }
            });
        } else {
            if (backInfo) {
                conn.sendJSON({action: 'send_back', success: false, message: '用户不存在'});
            }
        }
    });
}

function getMessage(data, conn) {
    //var list1 = {from_id: 30, to_id: 31, msg: {type: 'text', text: 'hi'}, date: new Date()};
    //var list2 = {from_id: 31, to_id: 30, msg: {type: 'text', text: '亲，你好'}, date: new Date()};
    //conn.sendJSON({action: 'message_record_back', total: 10, data: [list1, list2]});
    //return;
    if (!data.user_id) return conn.sendJSON({success: false, message: 'user_id 未定义'});
    if (!data.page) data.page = 1;
    if (!data.limit) data.limit = 10;
    //models.Message.count();
    db.driver.execQuery('select count(*) as count from chat_message where' +
    ' from_id=? AND to_id = ? OR from_id=? AND to_id=?', [data.user_id, conn.id, conn.id, data.user_id],function(err,count) {
        //console.log(count[0].count);

        if (err) return conn.sendJSON({success:false,message:err});
        models.Message.find(['date', 'Z'])
            .where("from_id=? AND to_id = ? OR from_id=? AND to_id=?", [data.user_id, conn.id, conn.id, data.user_id])
            .limit(data.limit * 1)
            .offset((data.page - 1) * data.limit)
            .run(function (err, msgs) {
                if (err) return conn.sendJSON({success: false, message: err});
                msgs.forEach(function (msg) {
                    msg.save({hasRead: true});
                    msg.msg = JSON.parse(msg.msg);
                });

                conn.sendJSON({action: 'message_record_back',total:count[0].count, data: msgs});
                //conn.sendJSON({action:'msg',data:msgs});
            });

        models.LastestMessage.find({user_id: conn.id, friend_id: data.user_id}, function (err, lastest_msg) {


            if (err) return cb(err);
            console.log(lastest_msg)
            if (lastest_msg.length > 0) {
                if (lastest_msg[0].unReadCount==0) return;
                lastest_msg[0].save({
                    unReadCount: 0
                }, function (err) {
                });
            }
        });
    })


}

function getMessageTest(data, conn) {
    conn.id = 31;
    db.driver.execQuery('SELECT user_info.user_id,user_info.icon,user_info.nickname,' +
    'chat_message.msg,last_msg.updateDate as date,last_msg.unReadCount as unread_count' +
    ' FROM last_msg,user_info,chat_message' +
    ' WHERE last_msg.user_id =?' +
    ' AND last_msg.friend_id = user_info.user_id' +
    ' AND last_msg.msg_id = chat_message.id' +
    ' order by last_msg.updateDate limit 0,10',[conn.id],function(err, datas) {
            conn.sendJSON({action: 'message_list_back', data: datas})
        });
}

function getMessageListTest(data, conn) {

}

function getMessageList(data, conn) {

    db.driver.execQuery('SELECT user_info.user_id,user_info.icon,user_info.nickname,' +
    'chat_message.msg,last_msg.updateDate as date,last_msg.unReadCount as unread_count' +
    ' FROM last_msg,user_info,chat_message' +
    ' WHERE last_msg.user_id =?' +
    ' AND last_msg.friend_id = user_info.user_id' +
    ' AND last_msg.msg_id = chat_message.id' +
    ' order by last_msg.updateDate limit 0,100',[conn.id],function(err, datas) {
        datas.forEach(function(d){
            d.msg = JSON.parse(d.msg);
        });
        conn.sendJSON({action: 'message_list_back', data: datas})
    });

    //根据情况 选择性更新未读数据为0

    //var list = {
    //    user_id: 30, icon: "4034970a304e251fee90ebf5a586c9177f3e5353.jpg"
    //    , nickname: 'zack', msg:{type:'text',text:'hi'}, date: new Date(), unread_count: 1
    //};
    //
    //conn.sendJSON({action: 'message_list_back', data: [list]});
    //if (conn) {
    //    models.Message.count({hasRead:false,from_id:from_id,to_id:conn.id},function(err,count) {
    //        if (err) return conn.sendJSON({success:false,message:err});
    //        conn.sendJSON({action:'count',count:count});
    //    })
    //} else {
    //    conn = from_id;
    //    db.driver.execQuery('SELECT to_id, COUNT(*) as count FROM chat_message',function(err, rows){
    //        if(err) return conn.sendJSON({success:false,message:rows});
    //    });
    //}

    //db.driver.execQuery('SELECT user_info.user_id,user_info.icon,user_info.nickname,chat_message.msg,last_msg.updateDate,last_msg.unReadCount as unread_count' +
    //' FROM last_msg,user_info,chat_message' +
    //' WHERE last_msg.user_id =?' +
    //' AND last_msg.friend_id = user_info.user_id' +
    //' AND last_msg.msg_id = chat_message.id' +
    //' order by last_msg.updateDate limit 0,10',[conn.id])
    //    .run(function(err, datas) {
    //        conn.sendJSON({action: 'message_list_back', data: datas})
    //    });
}

function logMessage(data, cb) {
    var msg = {};
    msg.from_id = data.from_id;
    msg.to_id = data.to_id;
    msg.msg = JSON.stringify(data.msg);
    msg.hasRead = data.hasRead || true;
    //data.msg = JSON.stringify(data.msg);
    //if (!data.hasRead) data.hasRead = true;

    if (!data.user_id) return cb('user_id undefined');
    var user_id = data.user_id;
    var friend_id = user_id == data.from_id ? (data.to_id || 0) : (data.from_id || 0);

    models.Message.create(msg, function (err, info) {
        if(!err) {
            saveFriendShip(user_id, friend_id,info.id, 1, function (err) {
                if (!err) {
                    saveFriendShip(friend_id, user_id, info.id, 2, function (err) {
                        cb(err);
                    });
                } else {
                    cb(err);
                }
            });
        } else {
            cb(err);
        }


    });



}

// relation 1 received, 2 send
function saveFriendShip(user_id, friend_id,msg_id, relation, cb) {

    models.LastestMessage.find({user_id: user_id, friend_id: friend_id}, function (err, lastest_msg) {



        if (err) return cb(err);
        console.log(lastest_msg)
        if (lastest_msg.length>0) {
            lastest_msg[0].save({
                relation: relation,
                msg_id:msg_id,
                unReadCount:relation==2?(lastest_msg[0].unReadCount||0)+1:0
            },function(err) {
                cb(err);
            });
        } else {
            models.LastestMessage.create({
                user_id: user_id,
                friend_id: friend_id,
                relation: relation,
                msg_id:msg_id,
                unReadCount:relation==1?1:0
            }, function (err, rel) {
                cb(err);
            });
        }

    });
}




