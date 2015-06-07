'user strict';



var appModule = angular.module('appModule', ['ngRoute', 'ngTouch','xyzModule', 'loginModule', 'chatModule','waterFallModule', 'userModule','yzRankModule','integralRankModule','editInfoModule','changePwdModule','friendDetailModule']);


appModule.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/xyz', {
        templateUrl: 'app/xyz/xyz.html',
        controller: 'XyzController'
        //resolve: {
        //    getAlbumList: ['xyzService', function (xyzService) {
        //        return xyzService.resolve;
        //    }]
        //}
    }).when('/chat', {
        templateUrl: 'app/chat/chat.html',
        controller: 'ChatController'
    }).when('/user', {
        templateUrl: 'app/user/user.html',
        controller: 'UserController'
    }).when('/chat_room', {
        templateUrl: 'app/chat/chat_room/chat_room.html',
        controller: 'ChatRoomController'
    }).when('/take_photo', {
        templateUrl: 'app/xyz/take_photo/take_photo.html',
        controller: 'TakePhotoController'
    }).when('/my_photo', {
        templateUrl: 'app/user/my_photo/my_photo.html',
        controller: 'MyPhotoController'
    }).when('/yz_rank', {
        templateUrl: 'app/xyz/yz_rank/yz_rank.html',
        controller: 'YzRankCtrl'
    }).when('/integral_rank', {
        templateUrl: 'app/xyz/integral_rank/integral_rank.html',
        controller: 'IntegralRankCtrl'
    }).when('/edit_info', {
        templateUrl: 'app/user/edit_info/edit_info.html',
        controller: 'EditInfoCtrl'
    }).when('/change_pwd', {
        templateUrl: 'app/user/change_pwd/change_pwd.html',
        controller: 'ChangePwdCtrl'
    }).when('/friend_detail', {
        templateUrl: 'app/chat/friend_detail/friend_detail.html',
        controller: 'FriendDetailCtrl'
    }).when('/water_fall', {
        templateUrl: 'app/xyz/water_fall/water_fall.html',
        controller: 'WaterFallCtrl'
    }).otherwise({
        redirectTo: '/xyz'
    });
}]);

appModule.controller('AppController', ['$scope', '$timeout','service', function (scope,$timeout, service) {

    scope.service = service;

    if(debug){
        service.user.name = '15189345238';
        service.user.pwd = '228320';
    }
    var isOtherLogin = false;

    scope.$on(SERVICE_WS_CONNECT, function(event, data) {
        // //console.log(data)
        console.log("websocket连接成功");
    });

    scope.$on(WS_MSG_LIST, function (event, data) {
        $timeout(function () {
            service.func.loadMessageList(data)
        });
    });

    scope.$on(WS_MSG_RECEIVE, function (event, data) {
        service.net.getMessageList();
    });
    
    scope.$on(WS_CLOSE, function (event) {
       console.log("websocket重连中");
        $timeout(function () {
            if(!isOtherLogin)
            {
                service.net.connectWS();
            }else{
                console.log("异地登录,不重连");
                service.net.logout();
                $('#modal-logout').modal('show');
            }
        },500);

    });
    scope.$on(WS_CLOSE_LOGOUT, function (event, data) {
        console.log(data);
        isOtherLogin = true;
    });

    scope.$on(SERVICE_LOGOUT, function(event, data) {
        if (data.success) {
            service.user = {};
            service.ws.close();
        } else {
            $element.text(data.message);
        }
    });

    Date.prototype.Format = function (fmt) { //author: meizz
        var o = {
            "M+": this.getMonth() + 1, //月份
            "d+": this.getDate(), //日
            "h+": this.getHours(), //小时
            "m+": this.getMinutes(), //分
            "s+": this.getSeconds(), //秒
            "q+": Math.floor((this.getMonth() + 3) / 3), //季度
            "S": this.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt))
            fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt))
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }

    $(".fancybox").fancybox({
        openEffect	: 'none',
        closeEffect	: 'none'
    });

    $timeout(function () {
        $("#page3").click();
        $timeout(function () {
            $("#page2").click();
            $timeout(function () {
                $("#page1").click();
            },2000);
        },2000);
    },2000);

}]);


//获取用户信息，用于验证是否登录过
appModule.directive('userInfo', ['$location','service','$timeout','$route', function($location,service,$timeout,$route) {
    return {
        restrict: 'A',
        controller: function($scope, $element, $attrs, $transclude) {
            $scope.$on(SERVICE_USER_INFO, function (event, data) {
                //console.log(data);
                if (data.success) {
                    $timeout(function () {
                        service.func.loadUserData(data);
                        $route.reload();
                        if(!service.func.verifyWS())service.net.getWSToken();
                    });
                }else{
                    //console.info($location.path())
                    if($location.path() != '/chat' && $location.path() != '/xyz' && $location.path() != '/user'){
                        $location.path('/xyz');
                    }
                }
            });
        },
        link: function($scope, iElm, iAttrs, controller) {
            service.net.getUserInfo();
            //console.log('directive:userInfo');
        }
    };
}]);

appModule.directive('heightEqualWidth', ['$timeout','service', function($timeout,service) {
    return {
        link: function($scope, iElm, iAttrs, controller) {
            var icon = iAttrs.heightEqualWidth;
            if(icon.length<1)icon="resource/images/touxiang.png";
            //console.info(icon);
            //console.log(iElm.width());
            $timeout(function () {
                iElm.height(iElm.width());
                //console.log(iElm.width());
            },50);


            iElm.css('background-image',"url('"+icon+"')");
            iElm.css('background-size','cover');
            iElm.css('background-repeat','no-repeat');
            iElm.css('background-position','center');
            window.onresize = function() {
                iElm.height(iElm.width());
            };
            console.log('directive:heightEqualWidth')
        }
    };
}]);

appModule.directive('changeSex', ['$timeout','service', function($timeout,service) {
    return {
        link: function($scope, iElm, iAttrs, controller) {
            iElm.bind("click", function () {
                var  sex = iAttrs.changeSex;
                service.sex = sex;
                document.getElementById("sex").innerHTML = iElm.text();
                service.net.getAlbumList();
                service.net.integralRank('all');
                service.net.yzRank('all');
            });
        }
    };
}]);

appModule.directive('lunchPage', ['$timeout','service', function($timeout,service) {
    return {
        restrict:'C',
        link: function($scope, iElm, iAttrs, controller) {
            var startP = {
                x:0,
                y:0
            };
            var endP = {
                x:0,
                y:0
            };
            var offsetY = 0;
            var offsetX = 0;
            iElm.bind("touchstart", function (e) {
                startP.x = e.originalEvent.touches[0].pageX;
                startP.y = e.originalEvent.touches[0].pageY;
                offsetY = 0;
            });
            iElm.bind("touchmove", function (e) {
                endP.x = e.originalEvent.touches[0].pageX;
                endP.y = e.originalEvent.touches[0].pageY;
                offsetY = endP.y-startP.y;
                offsetX = endP.x-startP.x;
                //if(offsetY>0)return;
                //iElm.css('top',offsetY);
                if(offsetX>0)return;
                iElm.css('left',offsetX);
            });
            iElm.bind("touchend", function (e) {
                if(Math.abs(offsetX)>0)
                    iElm.animate({
                        'left':'-100%'
                    });
                //if(Math.abs(offsetY)<iElm.height()/3){
                //    iElm.animate({
                //        'top':0
                //    });
                //}else{
                //    iElm.animate({
                //        'top':'-100%'
                //    });
                //}
            });

            iElm.bind("click", function (e) {
                iElm.animate({
                    'left':'-100%'
                });
            });

        }
    };
}]);
