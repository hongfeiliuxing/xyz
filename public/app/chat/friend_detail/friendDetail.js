/**
 * Created by SenPng on 15/4/21.
 */
var friendDetailModule = angular.module('friendDetailModule', ['serviceModule']);

friendDetailModule.controller('FriendDetailCtrl', ['$scope', '$location', 'service', function ($scope, location, service) {


    var userId = location.search().userId;

    //service.config.backRoute = "#xyz";
    service.config.backRoute = '#'+location.search().backRoute+'?userId='+userId;

    service.net.getFriendInfo(userId);


    $scope.friend = {};


}]);

friendDetailModule.directive('friendDetail', ['$location', 'service', '$timeout','$route', function (location, service, timeout,$route) {
    return {
        restrict: 'C',
        controller: function ($scope, $element, $attrs, $transclude) {
            var userId = location.search().userId;

            $scope.$on(SERVICE_FRIEND_INFO, function (event,data) {
                console.log(data);
                if(data.success){
                    var friend = data.message;
                    timeout(function () {
                        $scope.friend = friend;
                        service.config.currentTitle = friend.nickname;
                        service.net.getFriendPhoto(userId,1,100);
                    });
                }
            });
            $scope.$on(SERVICE_FRIEND_PHOTO, function (event,data) {
                console.log(data);
                if(data.success){
                    var photos = data.data;
                    timeout(function () {
                        $scope.friend.photos = photos;
                    });
                }
            });
        },
        link: function ($scope, iElm, iAttrs, controller) {
            var userId = location.search().userId;


            //console.log("directive:chatRoom");
        }
    }
}]);



//friendDetailModule.directive('loadMore',['$timeout','$location','service', function ($timeout,$location, service) {
//    return {
//        link: function($scope,iElm,iAttrs,controllers){
//            iElm.bind('click', function () {
//                if($scope.isAll)return;
//                iElm.button('loading');
//                var userId = $location.search().userId;
//                $scope.isScrolling = true;
//                service.net.getMessageRecord(userId,$scope.page,10);
//            })
//        }
//    }
//}])

