var chatRoomModule = angular.module('chatRoomModule', ['serviceModule']);

chatRoomModule.controller('ChatRoomController', ['$scope', '$location', 'service', function ($scope, location, service) {


    var userId = location.search().userId;
    $scope.friendId = userId;

    //service.config.backRoute = "#xyz";
    service.config.backRoute = '#'+location.search().backRoute;

    var isFriend = false;

    $.each(service.config.messageList, function (item, key) {
        if (key.user_id == userId) {
            $scope.friendIcon = key.icon;
            service.config.currentTitle = key.nickname;
            isFriend = true;
        }
    });

    if(!isFriend){
        service.net.getFriendInfo(userId);
    }

    if (!service.user.isLogin) {
        location.path('/xyz');
    }

    $scope.page = 1;
    $scope.isAll = false;

    $scope.isToday = function(a) {//yy-MM-dd
        var arr = a.split("-");
        arr[2] = arr[2].split('T')[0];
        var starttime = new Date(arr[0], arr[1], arr[2]);
        var starttimes = starttime.getTime();

        var date = new Date().Format("yyyy-MM-ddThh:mm:ss");
        var arrs = date.toString().split("-");
        arrs[2] = arrs[2].split('T')[0];
        var lktime = new Date(arrs[0], arrs[1], arrs[2]);
        var lktimes = lktime.getTime();

        if (starttimes >= lktimes) {

            return true;
        }
        else
            return false;

    }

}]);

chatRoomModule.directive('chatRoom', ['$location', 'service', '$timeout', function (location, service, timeout) {
    return {
        restrict: 'C',
        controller: function ($scope, $element, $attrs, $transclude) {
            $scope.$on(WS_MSG_RECORD, function (event, data) {

                    var element = $element[0];

                    if(data.total<=service.config.messageRecord.length){
                        timeout(function(){
                            $scope.isAll = true;
                        });

                    }else{
                        timeout(function(){
                            var oldClientHeight = element.clientHeight;
                            service.func.loadMessageRecord(data.data);
                            $scope.page++;

                            if(service.config.messageRecord.length == data.data.length){
                                timeout(function () {
                                    //document.body.scrollTop = element.clientHeight;
                                    $('body').animate({
                                        scrollTop: element.clientHeight
                                    }, 300);
                                },200);
                            }else{
                                timeout(function () {
                                    document.body.scrollTop = element.clientHeight-oldClientHeight;
                                    //$('body').animate({
                                    //    scrollTop: element.clientHeight-oldClientHeight
                                    //}, 300);
                                },200);
                            }
                        });



                        $element.find('button').button('reset');
                    }

            });

            $scope.$on(WS_MSG_SEND, function (event, data) {
                var userId = location.search().userId;
                var content = $element.find('textarea').val();
                //console.log(data);
                if (data.success) {
                    //var date = new Date().Format("yyyy-MM-ddThh:mm:ss"); //2015-04-06T05:18:59.000Z
                    var message = {
                        date: data.data.date,
                        from_id: service.user.user_id,
                        to_id: userId,
                        msg: {
                            type: 'text',
                            text: content
                        }
                    };


                    timeout(function () {
                        service.config.messageRecord.push(message);
                        $('body').animate({
                            scrollTop: $('.chat-room')[0].scrollHeight * 2
                        }, 300);
                        // document.body.scrollTop = $('.chat-room')[0].scrollHeight;
                        $element.find('textarea').val('');
                    });
                }
            });


            $scope.$on(WS_MSG_RECEIVE, function (event, data) {
                console.log(data);
                if(data.success){
                	var userId = location.search().userId;
                    if(data.data.from_id != userId) return;
                    service.config.messageRecord.push(data.data);
                    $('body').animate({
                        scrollTop: $('.chat-room')[0].scrollHeight * 2
                    }, 300);
                    var userId = location.search().userId;
                    service.net.clearUNRead(userId);
                }
                //var userId = location.search().userId;
                //service.config.messageRecord = [];
                //service.net.getMessageRecord(userId);
            });

            $scope.$on(WS_CLEAR_UNREAD, function (event, data) {
                console.log(data);
            });



            $scope.$on(SERVICE_FRIEND_INFO, function (event,data) {
                //console.log(data);
                if(data.success){
                    var friend = data.message;
                    $scope.friendIcon = friend.icon;
                    service.config.currentTitle = friend.nickname;
                }
            });
        },
        link: function ($scope, iElm, iAttrs, controller) {
            var userId = location.search().userId;

            service.config.messageRecord = [];

            service.net.getMessageRecord(userId,1,10);

            iElm.find('button').bind('click', function () {
                service.net.sendMessage(userId, iElm.find('textarea').val());
            });



            //console.log("directive:chatRoom");
        }
    }
}]);

//chat_room界面中聊天气泡处理
chatRoomModule.directive('chatBubble', function () {
    // Runs during compile
    return {
        link: function ($scope, iElm, iAttrs, controller) {
            var span = iElm.find('span');
            var screen_width = $(window).width()
            // //console.log(span.text())

            span.text($scope.message.msg.text);
            if (span.width() > screen_width * 0.65) {
                iElm.css({
                    padding: '10px',
                    textAlign: 'left'
                });

                switch (iAttrs.chatBubble) {
                    case 'right':
                        iElm.css('background-color', '#f35b66');
                        break
                    default:
                        iElm.css('background-color', '#e5e5e5');
                }

            } else {
                span.css({
                    padding: '5% 2%'
                });

                switch (iAttrs.chatBubble) {
                    case 'right':
                        span.css('background-color', '#f35b66');
                        break;
                    default:
                        span.css('background-color', '#e5e5e5');
                }
            }
            //console.log("directive:chatBubble");
        }
    };
});

chatRoomModule.directive('loadMore',['$timeout','$location','service', function ($timeout,$location, service) {
    return {
        link: function($scope,iElm,iAttrs,controllers){
            iElm.bind('click', function () {
                if($scope.isAll)return;
                iElm.button('loading');
                var userId = $location.search().userId;
                $scope.isScrolling = true;
                service.net.getMessageRecord(userId,$scope.page,10);
            })
        }
    }
}])

