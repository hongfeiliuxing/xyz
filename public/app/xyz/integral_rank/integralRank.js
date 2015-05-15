/**
 * Created by SenPng on 15/4/13.
 */
/**
 * Created by SenPng on 15/4/13.
 */
var integralRankModule = angular.module('integralRankModule',['serviceModule']);

integralRankModule.controller('IntegralRankCtrl',['$scope','$location','service', function ($scope, $location,service) {
    $scope.ranks = [];
    service.config.backRoute = '#'+$location.search().backRoute;
    $scope.rankType = 'day';
    service.config.currentTitle = '积分榜';
}]);

integralRankModule.directive('integralRank',['$timeout','service', function ($timeout,service) {
    return {
        restrict:'C',
        controller: function ($scope,$element,$attrs,$transclude) {
            $scope.$on(SERVICE_INTEGRAL_RANK, function (event, data) {
                //console.info(data);
                if(data.success){
                    $scope.ranks = data.message;
                    angular.forEach($scope.ranks, function (key, item) {
                        key.color = '#b2b3b4';
                    });
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
            service.net.integralRank('day');
        }
    }
}]);

integralRankModule.directive('changeRankData2',['$timeout','service', function ($timeout, service) {
    return {
        controller: function ($scope,$element,$attrs,$transclude) {

        },
        link: function ($scope, iElm, iAttrs, controller) {
            iElm.bind('click', function () {
                var rankType = iAttrs.changeRankData2;
                if($scope.rankType == rankType)return;
                service.net.integralRank(rankType);
            });
        }
    }
}]);
