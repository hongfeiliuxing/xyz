/**
 * Created by SenPng on 15/4/7.
 */

'user strict';

var xyzModule = angular.module('xyzModule', ['serviceModule','takePhotoModule','angularFileUpload']);


xyzModule.controller('XyzController', ['$scope', '$window','$location','service','FileUploader', function ($scope,$window,$location,service,FileUploader) {

    var helper = {
        support: !!($window.FileReader && $window.CanvasRenderingContext2D),
        isFile: function (item) {
            return angular.isObject(item) && item instanceof $window.File;
        },
        isImage: function (file) {
            var type = '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
    };

    var uploader = $scope.uploader = new FileUploader({
        url: ''
    });

    // FILTERS

    uploader.filters.push({
        name: 'imageFilter',
        fn: function (item /*{File|FileLikeObject}*/, options) {
            var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
    });

    // CALLBACKS

    uploader.onWhenAddingFileFailed = function (item /*{File|FileLikeObject}*/, filter, options) {
        console.info('onWhenAddingFileFailed', item, filter, options);
    };
    uploader.onAfterAddingFile = function (fileItem) {
        console.info('onAfterAddingFile', fileItem);
    };
    uploader.onAfterAddingAll = function (addedFileItems) {
        console.info('onAfterAddingAll', addedFileItems);
        if (!helper.support) return;

        var file = addedFileItems[addedFileItems.length-1]._file;

        if (!helper.isFile(file)) return;
        if (!helper.isImage(file)) return;

        //console.log(file);

        //var reader = new FileReader();
        //
        //reader.onload = onLoadImage;
        //reader.readAsDataURL(file);

        fixImageTool().loadInputFileObj(file, function (base64String) {
            service.config.showPhoto = base64String;
            $scope.$apply(function(){
                $location.path('/take_photo');
            });
        });

        //function onLoadImage(event) {
        //    service.config.showPhoto = event.target.result;
        //    $scope.$apply(function(){
        //        $location.path('/take_photo');
        //    });
        //}
    };
    uploader.onBeforeUploadItem = function (item) {
        console.info('onBeforeUploadItem', item);
    };
    uploader.onProgressItem = function (fileItem, progress) {
        console.info('onProgressItem', fileItem, progress);
    };
    uploader.onProgressAll = function (progress) {
        console.info('onProgressAll', progress);
    };
    uploader.onSuccessItem = function (fileItem, response, status, headers) {
        console.info('onSuccessItem', fileItem, response, status, headers);
    };
    uploader.onErrorItem = function (fileItem, response, status, headers) {
        console.info('onErrorItem', fileItem, response, status, headers);
    };
    uploader.onCancelItem = function (fileItem, response, status, headers) {
        console.info('onCancelItem', fileItem, response, status, headers);
    };
    uploader.onCompleteItem = function (fileItem, response, status, headers) {
        console.info('onCompleteItem', fileItem, response, status, headers);
    };
    uploader.onCompleteAll = function () {
        console.info('onCompleteAll');
    };


    $scope.albumList = [];
    if(service.config.albumList.length>0){
        $scope.albumList = service.config.albumList;
    }

    $scope.xyz = {
    	isGood:false
    }

//    $scope.xyz.isGood = false;


    if(service.user.isLogin && $scope.albumList.length>0){
        service.net.isGood($scope.albumList[2].photo_id);
    }

    service.func.resetTabActive(0);


}]);

xyzModule.factory('xyzService', ['$http','$rootScope','service', function (http,rootScope,service) {

        var service = {
            resolve:{
                delay: ['$q', function ($q) {
                    var delay = $q.defer();
                    if(service.config.albumList.length<1){
                        http({
                            url: service.url + service.api.album_list + '?page=' + 1 + '&limit=' + 10
                        }).success(function (data) {
                            //console.log(data);
                            if (data.success) {
                                service.func.loadAlbumList(data.data);
                            }
                            delay.resolve();
                        }).error(function () {
                            delay.resolve();
                        });
                    }else{
                        delay.resolve();
                    }

                    return delay.promise;
                }]
            }

        };

        return service;

}]);


//我要秀颜值
xyzModule.directive('showPhoto', ['$location','service',function ($location,service) {
    return {
        restrict: 'A',
        link: function ($scope, iElm, iAttrs, controller) {

            iElm.bind('click', function () {

                if (service.user.isLogin) {
                    $scope.$apply(function(){
                        $location.path('/take_photo');
                    });

                } else {
                    $('#modal-login').modal('show')
                }
            });

            //console.log('directive:showPhoto');

            service.config.backRoute = '';
        }
    };
}]);

xyzModule.directive('switch',['$timeout','service', function ($timeout,service) {
    return {
        controller:function($scope,$element,$attrs,$transclude){

        },
        link: function ($scope, iElm, iAttrs, controller) {
            iElm.bind('click', function () {
                service.net.getAlbumList();
            });
        }

    };
}]);

//照片墙
xyzModule.directive('album', ['$timeout', 'service',function (timeout,service) {

    // Runs during compile
    return {
        restrict: 'C',
        controller:function($scope,$element,$attrs,$transclude){
            $scope.$on(SERVICE_ALBUM_LIST, function (event, data) {
                //console.log(data.data);
                if (data.success) {
                    service.func.loadAlbumList(data.data);
                    $scope.albumList = data.data;
                    timeout(function () {
                        var screen_width = $(window).width();

                        $('.album-content').animate({
                            height: screen_width * 1.2 / 2 + 'px',
                            marginLeft: -screen_width * 0.75 + 'px'
                        }, 1000);
                        $('.album-item').width(screen_width / 2);

                    }, 50);

                    service.net.isGood($scope.albumList[2].photo_id);
                }
            });

            $scope.$on(SERVICE_IS_GOOD, function (event,data) {
                ////console.log(data);
                if(data.success){
                    timeout(function () {
                        $scope.xyz.isGood = data.message.isGood;
                        console.log($scope.xyz.isGood);
                    });
                }
            });
        },
        link: function ($scope, iElm, iAttrs, controller) {
            ////console.log('directive:album');

            if(service.config.albumList.length<1){
                service.net.getAlbumList();
            }

            var isSwiping = false;

            $scope.swipeLeft = function () {

                if(isSwiping)return;
                isSwiping = true;

                var data = $scope.albumList;
                var screen_width = $(window).width();

                iElm.animate({
                    marginLeft: Number(iElm.css('margin-left').split('px')[0]) - screen_width / 2 + 'px'
                }, 'swing', function () {
                    data.push(data.shift());
                    timeout(function () {
                        service.func.loadAlbumList(data);
                        $scope.albumList = data;
                        if(service.user.isLogin){
                            service.net.isGood(data[2].photo_id);
                        }

                        isSwiping = false;
                        iElm.css('margin-left', Number(iElm.css('margin-left').split('px')[0]) + screen_width / 2 + 'px');
                    });
                });
            };

            $scope.swipeRight = function () {
                if(isSwiping)return;
                isSwiping = true;

                var data = $scope.albumList;
                var screen_width = $(window).width();

                iElm.animate({
                    marginLeft: Number(iElm.css('margin-left').split('px')[0]) + screen_width / 2 + 'px'
                }, 'swing', function () {
                    data.unshift(data.pop());
                    timeout(function () {
                        service.func.loadAlbumList(data);
                        $scope.albumList = data;
                        if(service.user.isLogin){
                            service.net.isGood(data[2].photo_id);
                        }

                        isSwiping = false;

                        iElm.css('margin-left', Number(iElm.css('margin-left').split('px')[0]) - screen_width / 2 + 'px');
                    });

                });
            };




            timeout(function () {
                var screen_width = $(window).width();

                //$('.album-content').animate({
                //    height: screen_width * 1.2 / 2 + 'px',
                //    marginLeft: -screen_width * 0.75 + 'px'
                //}, 1000);

                $('.album-content').height(screen_width * 1.2 / 2);
                $('.album-content').css('margin-left', -screen_width * 0.75 + 'px');

                $('.album-item').width(screen_width / 2);

            });


            window.onresize = function () {
                var screen_width = $(window).width();

                $('.album-content').height(screen_width * 1.2 / 2);
                $('.album-content').css('margin-left', -screen_width * 0.75 + 'px');

                $('.album-item').width(screen_width / 2);
            }



            //}
        }

    };
}]);

xyzModule.directive('goodPhoto',['$timeout','service', function ($timeout, service) {
    return {
        controller: function ($scope, $element, $attrs, $transclude) {
            $scope.$on(SERVICE_GOOD_PHOTO, function (event, data) {
                //console.log(data);
                if(data.success){
                    $timeout(function () {
                        service.config.albumList[2].isGood=true;
                        $scope.xyz.isGood = true;
                        service.config.albumList[2].count++;
                    });
                }
            });
            $scope.$on(SERVICE_ERROR, function (event) {

            });
        },
        link: function ($scope, iElm, iAttrs, controller) {
            iElm.bind('click', function () {

                if(service.user.isLogin){
                    var photoId = iAttrs.goodPhoto;
                    if(!$scope.xyz.isGood){
                        service.net.goodPhoto(photoId);
                    }
                }else{
                    $('#modal-login').modal('show');
                }


            });
        }
    }
}]);

xyzModule.directive('chat',['$timeout','$location','service', function ($timeout, $location,service) {
    return {

        link: function ($scope, iElm, iAttrs, controller) {
            iElm.bind('click', function () {
                if(service.user.isLogin){
                    $timeout(function () {
                        var chat = iAttrs.chat.split(',');
                        if(chat[0]==service.user.user_id)return;
                        $location.url('/chat_room?userId='+chat[0]+'&backRoute='+chat[1]);
                    })
                }else{
                    $('#modal-login').modal('show');
                }

            });
        }
    }
}]);