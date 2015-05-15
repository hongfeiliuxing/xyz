/**
 * Created by SenPng on 15/4/11.
 */

var takePhotoModule = angular.module('takePhotoModule',['serviceModule']);

takePhotoModule.controller('TakePhotoController',['$scope','$location','service','$timeout',function($scope,$location,service,$timeout){
    //service.config.backRoute = '#xyz';
    service.config.backRoute = '#'+$location.search().backRoute;
    $scope.photo = service.config.showPhoto;
    $scope.cancel = function(){
        $timeout(function(){
            $location.path('/xyz');
        });
    }
}]);

takePhotoModule.directive('uploadPhoto',['service','$timeout','$location',function(service,$timeout,$location){
    return {
        controller:function($scope,$element,$attrs,$transclude){
            $scope.$on(SERVICE_UPLOAD_PHOTO,function(event,data){
                //(data);
                if(data.success){
                    $element.text('上传成功');
                }else{
                    $element.text(data.message);
                }
                $timeout(function(){
                    $element.button('reset');
                    $location.path('/xyz');
                    service.net.getAlbumList();
                },800)
            });

            $scope.$on(SERVICE_ERROR,function(event){
                //('网络错误');
            });
        },
        link:function($scope,iElm,iAttrs,controller){
            iElm.bind('click',function(){
                var base64String = $scope.photo;
                service.net.uploadPhoto(base64String);
                iElm.button('loading');
            });
        }

    };
}]);