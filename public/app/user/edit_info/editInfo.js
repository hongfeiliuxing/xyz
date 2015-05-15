/**
 * Created by SenPng on 15/4/15.
 */
var editInfoModule = angular.module('editInfoModule',['serviceModule']);

editInfoModule.controller('EditInfoCtrl',['$scope','$location','service', function ($scope,$location,service) {
    $scope.reset = function () {
        $scope.nickname = service.user.nickname;
        $scope.sex = service.user.sex;
        $scope.height = service.user.height;
        $scope.birthday = new Date(service.user.birthday);
    };
    $scope.reset();

    service.config.backRoute = '#'+$location.search().backRoute;
}]);

editInfoModule.directive('editInfo',['$timeout','service', function ($timeout, service) {
    return {
        restrict:'C',
        controller: function ($scope,$element,$attrs,$transclude) {
        },
        link:function($scope,iElm,iAttrs,controller){

        }
    }
}]);

editInfoModule.directive('submitData',['$timeout','$location','service', function ($timeout, $location,service) {
    return {
        controller: function ($scope,$element,$attrs,$transclude) {
            $scope.$on(SERVICE_EDIT_INFO, function (event, data) {
                console.log(data);
                if(data.success){
                    $element.text('修改成功');
                    service.net.getUserInfo();
                }else{
                    $element.text(data.message);
                }
                $timeout(function () {
                    $element.button('reset');
                    if(data.success)$location.path('/user');
                },800);
            });
            $scope.$on(SERVICE_USER_INFO, function (event, data) {
                console.log(data);
                if(data.success){
                    service.func.loadUserData(data);
                }
            });

            $scope.$on(SERVICE_ERROR, function (event, data) {
                $element.text('网络错误');
                $timeout(function () {
                    $element.button('reset');
                },800);
            });
        },
        link:function($scope,iElm,iAttrs,controller){
            iElm.bind('click', function () {
                iElm.button('loading');
                service.net.editInfo($scope.nickname,$scope.sex,$scope.birthday,$scope.height);
            });
        }
    }
}]);

