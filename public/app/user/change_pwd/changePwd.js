/**
 * Created by SenPng on 15/4/15.
 */
var changePwdModule = angular.module('changePwdModule',['serviceModule']);

changePwdModule.controller('ChangePwdCtrl',['$scope','$location','service', function ($scope,$location,service) {
    service.config.backRoute = '#'+$location.search().backRoute;
    $scope.oldPwd = '';
    $scope.pwd = '';
    $scope.pwd2 = '';
}]);


changePwdModule.directive('changePwd',['$timeout','$location','service', function ($timeout,$location, service) {
    return {
        controller: function ($scope,$element,$attrs,$transclude) {
            $scope.$on(SERVICE_CHANGE_PWD, function (event, data) {
                console.log(data);
                if(data.success){
                    $element.text('修改成功');
                    $scope.oldPwd = '';
                    $scope.pwd = '';
                    $scope.pwd2 = '';

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
                service.net.changePwd($scope.oldPwd,$scope.pwd);
            });
        }
    }
}]);

