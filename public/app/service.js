"user strict";

var serviceModule = angular.module('serviceModule', [])

var debug = false;

var SERVICE_ERROR = 'service.error',
    SERVICE_LOGOUT = 'service.logout',
    SERVICE_WS_CONNECT = 'service.wsConnect',
    WS_MSG_LIST = 'websocket.messageList',
    WS_MSG_RECORD = 'websocket.messageRecord',
    WS_MSG_SEND = 'websocket.messageSend',
    WS_MSG_RECEIVE = 'websocket.sendReceive',
    WS_CLEAR_UNREAD = 'websocket.clearUNRead',
    WS_CLOSE_LOGOUT = 'websocket.closeLogout',
    WS_CLOSE = 'websocket,close',
    SERVICE_ALBUM_LIST = 'servie.albumList',
    SERVICE_SEND_CODE = 'service.sendCode',
    SERVICE_VERTIFY_CODE = 'service.vertifyCode',
    SERVICE_VERTIFY_RESET_CODE = 'service.vertifyResetCode',
    SERVICE_WS_TOKEN = 'service.wsToken',
    SERVICE_LOGIN = 'service.login',
    SERVICE_USER_INFO = 'service.userInfo',
    SERVICE_REGIST = 'service.regist',
    SERVICE_UPLOAD_PHOTO = 'service.uploadPhoto',
    SERVICE_MY_PHOTO ='service.myPhoto',
    SERVICE_DEL_PHOTO='service.delPhoto',
    SERVICE_GOOD_PHOTO = 'service.goodPhoto',
    SERVICE_IS_GOOD = 'service.isGood',
    SERVICE_YZ_RANK = 'service.yzRank',
    SERVICE_INTEGRAL_RANK = 'service,integralRank',
    SERVICE_EDIT_INFO = 'service.editInfo',
    SERVICE_CHANGE_PWD = 'service.changePwd',
    SERVICE_MODIFY_PWD = 'service.modifyPwd',
    SERVICE_EDIT_ICON = 'service.editIcon',
    SERVICE_FRIEND_INFO = 'service.friendInfo',
    SERVICE_SEND_RESET_CODE = 'service.sendResetCode',
    SERVICE_FRIEND_PHOTO = 'service.friendPhoto'
    ;

serviceModule.factory('service', ['$rootScope', '$http', function (rootScope, http) {
    var service = {
        ws: null,
        url: debug?'http://192.168.10.218:3000':'http://xyz.wireless-world.cn',
        ws_url: debug?'ws://192.168.10.218:3001':'ws://xyz.wireless-world.cn:3001',
        api: {
            file_url: '/file/download/',
            userInfo: '/user/userInfo',
            friendInfo:'/user/friendInfo',
            login: '/user/login',
            logout: '/user/logout',
            ws_token: '/user/ws_token',
            album_list: '/photo/list',
            send_code: '/user/sendCode',
            send_reset_code: '/user/send_reset_code',
            vertify_code: '/user/vertify',
            vertify_reset_code: '/user/vertify_reset_code',
            regist: '/user/regist',
            upload_photo:'/photo/add',
            my_photo:'/photo/all',
            my_photo_good:'/photo/all_bygood',
            del_photo:'/photo/del',
            good_photo:'/photo/good',
            isGood:'/photo/isGood',
            yz_rank:'/photo/yanzhibang',
            integral_rank:'/photo/jifenbang',
            edit_info:'/user/edituserinfo',
            change_pwd:'/user/modifypassword',
            modify_pwd:'/user/modifypassword2',
            friend_photo:'/photo/friend_photo'
        },
        user: {},
        config: {
            tabs: [{
                id: 'xiuyanzhi',
                title: '秀颜值',
                route: '#xyz',
                icon: 'resource/images/tabbar/icon-xiuyanzhi',
                iconW: '26px',
                active: true
            }, {
                id: 'chat',
                title: '聊天',
                route: '#chat',
                icon: 'resource/images/tabbar/icon-chat',
                iconW: '33px',
                active: false,
                number: 0
            }, {
                id: 'user',
                title: '个人中心',
                route: '#user',
                icon: 'resource/images/tabbar/icon-user',
                iconW: '21px',
                active: false
            }],
            currentTitle: '秀颜值',
            backRoute: '',
            sex:null,
            nodes: [{
                title: '我的颜值秀',
                icon: 'resource/images/user/icon-head.png',
                desc: '',
                action: '#my_photo?backRoute=user',
                disabled:false
            }, {
                title: '游戏邀请',
                icon: 'resource/images/user/icon-hand.png',
                desc: '',
                action: '',
                disabled:true
            }, {
                title: '我的颜值币',
                icon: 'resource/images/user/icon-coin.png',
                desc: '0',
                action: '',
                disabled:false
            }, {
                title: '抽奖活动',
                icon: 'resource/images/user/icon-gift.png',
                desc: '火热进行中...',
                action: '',
                disabled:true
            },{
                title: '密码修改',
                icon: 'resource/images/login/icon-lock.png',
                desc: '',
                action: '#change_pwd?backRoute=user',
                disabled:false
            }],
            messageList: [],
            messageRecord: [],
            albumList: [],
            myPhotoList:[]
        },
        func: {
            getUserId: function (a) {
                var api = '';
                if(debug)api = (a+'id='+service.user.user_id);
                return api;
            },
            verifyLogin: function () {
                if (!service.user || !service.user.isLogin) {
                    return false;
                }
                return true;
            },
            verifyWS: function () {
                if (!service.ws || service.ws==null || service.ws.readyState != 1) {
                    return false;
                }
                return true;
            },
            resetTabActive: function (num) {
                for(var i=0;i<service.config.tabs.length;i++){
                    var tab = service.config.tabs[i];
                    if(num == i){
                        tab.active = true;
                        service.config.currentTitle = tab.title;
                    }else{
                        tab.active = false;
                    }
                }
                //angular.forEach(service.config.tabs, function (tab) {
                //    if (tab.active) {
                //        tab.active = false;
                //    }
                //});
            },
            //判断obj1与obj2类型是否匹配
            validationType: function (obj1, obj2) {
                return Object.prototype.toString.apply(obj1) == Object.prototype.toString.apply(obj2) && !isNaN(obj1);
            },
            loadUserData: function (data) {
                var message = data.message;
                var name = service.user.name;
                service.user = message;
                service.user.name = name;
                service.user.isLogin = true;
                service.config.nodes[2].desc = service.user.jifen;
            },
            loadMessageList: function (data) {
                service.config.messageList = data;
                var count = 0;
                $.each(data, function (item, key) {
                    var unread_count = key.unread_count;
                    count += unread_count;
                });

                service.config.tabs[1].number = count;
            },
            loadMessageRecord: function (data) {
                if(service.config.messageRecord.length>0){
                    service.config.messageRecord = service.config.messageRecord.concat(data);
                }else {
                    service.config.messageRecord = data;
                }
            },
            loadAlbumList: function (data) {
                service.config.albumList = data;
            },
            loadMyPhotoList: function (data) {
                if(service.config.myPhotoList.length>0){
                    service.config.myPhotoList = service.config.myPhotoList.concat(data);
                }else {
                    service.config.myPhotoList = data;
                }
            }
        },
        net: {
            getUserInfo: function () {
                http({
                    method: 'GET',
                    url: service.url + service.api.userInfo+service.func.getUserId('?')
                }).success(function (data) {
                    console.log(data);
                    rootScope.$broadcast(SERVICE_USER_INFO, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            getFriendInfo: function (uid) {
                http({
                    method: 'GET',
                    url: service.url + service.api.friendInfo+'/'+uid+service.func.getUserId('?')
                }).success(function (data) {
                    //console.log(data);
                    rootScope.$broadcast(SERVICE_FRIEND_INFO, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            getFriendPhoto: function (uid,page,limit) {
                http({
                    method: 'GET',
                    url: service.url + service.api.friend_photo+'/'+uid+'?page='+page+'&limit='+limit+service.func.getUserId('&')
                }).success(function (data) {
                    //console.log(data);
                    rootScope.$broadcast(SERVICE_FRIEND_PHOTO, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            uploadPhoto:function(base64String){
                if (!service.func.verifyLogin()) {
                    return;
                }
                http({
                    method: 'POST',
                    url: service.url + service.api.upload_photo+service.func.getUserId('?'),
                    data: {file: base64String}
                }).success(function (data) {
                    rootScope.$broadcast(SERVICE_UPLOAD_PHOTO, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            myPhoto:function(rankType,page,limit){
                if (!service.func.verifyLogin()) {
                    return;
                }
                http({
                    url: service.url + (rankType=='date'?service.api.my_photo:service.api.my_photo_good)+'?page='+page+'&limit='+limit+service.func.getUserId('&')
                }).success(function (data) {
                    data.rankType = rankType;
                    rootScope.$broadcast(SERVICE_MY_PHOTO, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            delPhoto: function (photoId) {
                if (!service.func.verifyLogin()) {
                    return;
                }
                http({
                    url: service.url + service.api.del_photo+'/'+photoId+service.func.getUserId('?')
                }).success(function (data) {
                    data.photoId = photoId;
                    rootScope.$broadcast(SERVICE_DEL_PHOTO, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            goodPhoto: function (photoId) {
                if (!service.func.verifyLogin()) {
                    return;
                }
                http({
                    method:'POST',
                    url: service.url + service.api.good_photo+'/'+photoId+service.func.getUserId('?')
                }).success(function (data) {
                    rootScope.$broadcast(SERVICE_GOOD_PHOTO, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            login: function () {
                http({
                    method: 'POST',
                    url: service.url + service.api.login,
                    data: {username: service.user.name, password: service.user.pwd}
                }).success(function (data) {
                    rootScope.$broadcast(SERVICE_LOGIN, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            getWSToken: function () {
                if (!service.func.verifyLogin()) {
                    return;
                }
                http({
                    url: service.url + service.api.ws_token +service.func.getUserId('?')
                }).success(function (data) {
                    rootScope.$broadcast(SERVICE_WS_TOKEN, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            sendCode: function (num) {
                http({
                    url: service.url + service.api.send_code + '?mobile=' + num
                }).success(function (data) {
                    rootScope.$broadcast(SERVICE_SEND_CODE, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            sendResetCode: function (num) {
                http({
                    url: service.url + service.api.send_reset_code + '?mobile=' + num
                }).success(function (data) {
                    rootScope.$broadcast(SERVICE_SEND_RESET_CODE, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            vertifyCode: function (num, code) {
                http({
                    url: service.url + service.api.vertify_code + '?mobile=' + num + '&code=' + code
                }).success(function (data) {
                    rootScope.$broadcast(SERVICE_VERTIFY_CODE, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            vertifyResetCode: function (num, code) {
                http({
                    url: service.url + service.api.vertify_reset_code + '?mobile=' + num + '&code=' + code
                }).success(function (data) {
                    rootScope.$broadcast(SERVICE_VERTIFY_RESET_CODE, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            logout: function () {
                if (!service.func.verifyLogin()) {
                    return;
                }
                http({
                    // method: 'POST',
                    url: service.url + service.api.logout
                }).success(function (data) {
                    rootScope.$broadcast(SERVICE_LOGOUT, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            getAlbumList: function () {
                http({
                    url: service.url + service.api.album_list+'?sex='+service.sex
                }).success(function (data) {
                    rootScope.$broadcast(SERVICE_ALBUM_LIST, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            isGood:function(photoId){
                if (!service.func.verifyLogin()) {
                    return;
                }
                http({
                    method: 'POST',
                    url: service.url + service.api.isGood+'/'+photoId+service.func.getUserId('?')
                }).success(function (data) {
                    rootScope.$broadcast(SERVICE_IS_GOOD, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            regist:function(mobile,code,nickname,sex,birthday,height,icon,password){
                http({
                    method: 'POST',
                    url: service.url + service.api.regist,
                    data:{mobile:mobile,code:code,nickname:nickname,sex:sex,birthday:birthday,height:height,icon:icon,password:password}
                }).success(function (data) {
                    rootScope.$broadcast(SERVICE_REGIST, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            editInfo: function (nickname, sex, birthday,height) {
                http({
                    method: 'POST',
                    url: service.url + service.api.edit_info+service.func.getUserId('?'),
                    data:{nickname:nickname,sex:sex,birthday:birthday,height:height}
                }).success(function (data) {
                    rootScope.$broadcast(SERVICE_EDIT_INFO, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            editIcon: function (icon) {
                http({
                    method: 'POST',
                    url: service.url + service.api.edit_info+service.func.getUserId('?'),
                    data:{icon:icon}
                }).success(function (data) {
                    rootScope.$broadcast(SERVICE_EDIT_ICON, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            changePwd: function (oldPwd,newPwd) {
                http({
                    method: 'POST',
                    url: service.url + service.api.change_pwd+service.func.getUserId('?'),
                    data:{oldPwd:oldPwd,newPwd:newPwd}
                }).success(function (data) {
                    rootScope.$broadcast(SERVICE_CHANGE_PWD, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            modifyPwd: function (mobile,code,pwd) {
                http({
                    method: 'POST',
                    url: service.url + service.api.modify_pwd,
                    data:{mobile:mobile,code:code,password:pwd}
                }).success(function (data) {
                    rootScope.$broadcast(SERVICE_MODIFY_PWD, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            yzRank: function (type) {
                http({
                    url: service.url + service.api.yz_rank+'/'+type+'?sex='+service.sex
                }).success(function (data) {
                    data.message.rankType = type;
                    rootScope.$broadcast(SERVICE_YZ_RANK, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },
            integralRank: function (type) {
                http({
                    url: service.url + service.api.integral_rank+'/'+type+'?sex='+service.sex
                }).success(function (data) {
                    data.message.rankType = type;
                    rootScope.$broadcast(SERVICE_INTEGRAL_RANK, data);
                }).error(function () {
                    rootScope.$broadcast(SERVICE_ERROR);
                });
            },

            connectWS: function () {
                if (!service.func.verifyLogin()) {
                    return;
                }
                service.ws = new WebSocket(service.ws_url);
                service.ws.onopen = function () {

                    this.sendJSON = function (data) {
                        this.send(JSON.stringify(data));
                    };

                    this.onclose = function () {
                        console.log("Connection closed")
                        rootScope.$broadcast(WS_CLOSE);

                    };
                    this.onerror = function () {
                        console.error("Connection error")
                    };
                    this.onmessage = function (event) {
                        // console.log(service.ws.readyState)
                        console.log(event);
                        var data = JSON.parse(event.data);
                        switch (data.action) {
                            case 'open_back':
                            {
                                service.net.getMessageList();
                            }
                                break;
                            case 'message_list_back':
                            {
                                rootScope.$broadcast(WS_MSG_LIST, data.data);
                            }
                                break;
                            case 'message_record_back':
                            {
                                rootScope.$broadcast(WS_MSG_RECORD, data);
                            }
                                break;
                            case 'send_back':
                            {
                                rootScope.$broadcast(WS_MSG_SEND, data);
                            }
                                break;
                            case 'send_receive':
                            {
                                rootScope.$broadcast(WS_MSG_RECEIVE, data);
                            }
                                break;
                            case 'clear_unread_back':
                            {
                                rootScope.$broadcast(WS_CLEAR_UNREAD, data);
                            }
                                break;
                            case 'close':
                            {
                                rootScope.$broadcast(WS_CLOSE_LOGOUT, data);
                            }
                                break;
                            default:
                                console.log("Don't Know Action：" + data.action);
                        }
                        // console.log(data.data);
                    };

                    var json = {token: service.user.token, action: 'open'};

                    this.sendJSON(json);

                };
            },
            getMessageList: function () {
                if (!service.func.verifyWS()) {
                    return;
                }
                var json = {action: 'message_list'};
                service.ws.sendJSON(json);

                return true;
            },
            getMessageRecord: function (userId,p,l) {
                if (!service.func.verifyWS()) {
                    return;
                }

                var json = {action: 'message_record', user_id: userId,page:p,limit:l};
                service.ws.sendJSON(json);

                return true;
            },
            sendMessage: function (userId, content) {
                if (!service.func.verifyWS()) {
                    return;
                }

                var json = {action: 'send', to_id: userId, msg: {type: 'text', text: content}};
                service.ws.sendJSON(json);

                return true;
            },
            clearUNRead: function (userId) {
                if (!service.func.verifyWS()) {
                    return;
                }

                var json = {action: 'clear_unread', user_id: userId};
                service.ws.sendJSON(json);

                return true;
            }
        }
    };
    return service;
}]);
