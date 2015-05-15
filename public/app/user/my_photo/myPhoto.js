/**
 * Created by SenPng on 15/4/11.
 */

var myPhotoModule = angular.module('myPhotoModule',['serviceModule','ui.InfiniteScroll']);

myPhotoModule.controller('MyPhotoController',['$scope','service','$location',function($scope,service,$location){
    //service.config.backRoute = '#user';
    service.config.backRoute = '#'+$location.search().backRoute;
    $scope.rankType = 'date';
    service.config.currentTitle = '我的秀颜值';

    $scope.isScrolling = false;
    $scope.page = 1;
    $scope.isAll = false;
    $scope.onScroll = function () {
        if($scope.isScrolling)return;
        if($scope.isAll)return;

        $scope.isScrolling = true;
        service.net.myPhoto($scope.rankType,$scope.page,10);
    }
}]);

myPhotoModule.directive('myPhoto',['$timeout','service', function ($timeout,service) {
    return {
        restrict:'C',
        controller: function ($scope, $element, $attrs, $transclude) {
            $scope.$on(SERVICE_MY_PHOTO, function (event, data) {
                console.log(data)
                if(data.success){
                    $timeout(function(){
                        if(data.total<=service.config.myPhotoList.length){
                            $scope.isAll = true;
                        }else{
                            service.func.loadMyPhotoList(data.data);
                            $scope.page++;
                        }
                        $scope.isScrolling = false;
                        $scope.rankType = data.rankType;
                    });
                }else{

                }
            });
        },
        link: function ($scope, iElm, iAttrs, controller) {
                service.config.myPhotoList = [];
            service.net.myPhoto($scope.rankType,$scope.page,10);
        }
    }
}]);

myPhotoModule.directive('changeRankData3',['$timeout','service', function ($timeout, service) {
    return {
        controller: function ($scope,$element,$attrs,$transclude) {

        },
        link: function ($scope, iElm, iAttrs, controller) {
            iElm.bind('click', function () {
                var rankType = iAttrs.changeRankData3;
                if($scope.rankType == rankType)return;
                $scope.rankType = rankType;
                console.log($scope.rankType);
                $scope.page = 1;
                $scope.isScrolling = false;
                $scope.isAll = false;
                service.config.myPhotoList = [];
                service.net.myPhoto($scope.rankType,$scope.page,10);

            });
        }
    }
}]);

myPhotoModule.directive('delPhoto',['$timeout','service', function ($timeout,service)
{
    return {
        controller: function ($scope, $element, $attrs, $transclude) {
            $scope.$on(SERVICE_DEL_PHOTO,function(event,data){
                if(data.success && data.photoId == $attrs.delPhoto){
                    $element.text('删除成功');
                    for(var i=0;i<service.config.myPhotoList.length;i++){
                        var photo = service.config.myPhotoList[i];
                        if(photo.id==$attrs.delPhoto){
                            service.config.myPhotoList.splice(i,1);
                        }
                    }
                }else if(data.photoId == $attrs.delPhoto){
                    $element.text(data.message);
                }
                $timeout(function(){
                    $element.button('reset');
                },800)
            });

            $scope.$on(SERVICE_ERROR,function(event){
                //console.log('网络错误');
            });
        },
        link: function ($scope, iElm, iAttrs, controller) {
            iElm.bind('click', function () {
                var photoId = iAttrs.delPhoto;
                service.net.delPhoto(photoId);
                iElm.button('loading');
            });
        }
    }
}])