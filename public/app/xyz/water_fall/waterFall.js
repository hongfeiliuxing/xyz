var waterFallModule = angular.module('waterFallModule',['serviceModule']);

waterFallModule.controller('WaterFallCtrl',['$scope','service','$location', function ($scope, service,$location) {
    //service.config.backRoute = "#xyz";
    service.config.backRoute = '#'+$location.search().backRoute;
    service.config.currentTitle = '照片墙';
    $scope.photos = [];
}]);

waterFallModule.directive('waterFall',['$timeout','service', function ($timeout,service) {
    return {
        restrict:'C',
        controller: function ($scope,$element,$attrs,$transclude) {
            $scope.$on(SERVICE_WATER_FALL, function (event, data) {
                console.info(data);
                if(data.success){
                    $scope.photos = data.message;
                }
            });
            $scope.$on(SERVICE_ERROR, function () {
                console.error("网络错误");
            })
        },
        link:function($scope,iElm,iAttrs,controller){
            service.net.waterFall();
        }
    }
}]);

waterFallModule.directive('waterGoodPhoto',['$timeout','service', function ($timeout, service) {
    return {
        controller: function ($scope, $element, $attrs, $transclude) {
            $scope.$on(SERVICE_GOOD_PHOTO, function (event, data) {
                //console.log(data);
                if(data.success){
                    // $timeout(function () {
                    //     service.config.albumList[2].isGood=true;
                    //     $scope.xyz.isGood = true;
                    //     service.config.albumList[2].count++;
                    // });
                }
            });
            $scope.$on(SERVICE_ERROR, function (event) {

            });
        },
        link: function ($scope, iElm, iAttrs, controller) {
            iElm.bind('click', function () {

                if(service.user.isLogin){
                    var photoId = iAttrs.waterGoodPhoto;
                    // if(!$scope.xyz.isGood){
                        $scope.photo.isGood = true;
                        service.net.goodPhoto(photoId);
                    // }
                }else{
                    $('#modal-login').modal('show');
                }


            });
        }
    }
}]);