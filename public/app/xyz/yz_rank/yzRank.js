/**
 * Created by SenPng on 15/4/13.
 */
var yzRankModule = angular.module('yzRankModule',['serviceModule']);

yzRankModule.controller('YzRankCtrl',['$scope','service','$location', function ($scope, service,$location) {
    $scope.ranks = [];
    //service.config.backRoute = "#xyz";
    service.config.backRoute = '#'+$location.search().backRoute;
    $scope.rankType = 'day';
    service.config.currentTitle = '颜值榜';
}]);

yzRankModule.directive('yzRank',['$timeout','service', function ($timeout,service) {
    return {
        restrict:'C',
        controller: function ($scope,$element,$attrs,$transclude) {
            $scope.$on(SERVICE_YZ_RANK, function (event, data) {
                //console.info(data);
                if(data.success){
                    $scope.ranks = data.message;
                    if($scope.ranks[0])$scope.ranks[0].color = '#f55149';
                    if($scope.ranks[1])$scope.ranks[1].color = '#79ccf1';
                    if($scope.ranks[2])$scope.ranks[2].color = '#9ad185';

                    $scope.rankType = data.message.rankType;
                }
            });
            $scope.$on(SERVICE_ERROR, function () {
                console.error("网络错误");
            })
        },
        link:function($scope,iElm,iAttrs,controller){
            service.net.yzRank('day');
        }
    }
}]);

yzRankModule.directive('changeRankData',['$timeout','service', function ($timeout, service) {
    return {
        controller: function ($scope,$element,$attrs,$transclude) {
            
        },
        link: function ($scope, iElm, iAttrs, controller) {
            iElm.bind('click', function () {
                var rankType = iAttrs.changeRankData;
                if($scope.rankType == rankType)return;
                service.net.yzRank(rankType);
            });
        }
    }
}]);

//yzRankModule.directive('heightEqualWidth', ['$timeout','service', function(timeout,service) {
//    return {
//        link: function($scope, iElm, iAttrs, controller) {
//            iElm.height(iElm.width());
//            window.onresize = function() {
//                $('.yz-rank .icon').height($('.yz-rank .icon').width());
//            };
//            //console.log('directive:heightEqualWidth')
//        }
//    };
//}]);