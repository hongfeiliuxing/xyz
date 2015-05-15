/**
 * Created by SenPng on 15/4/7.
 */
'user strict';

var userModule = angular.module('userModule',['serviceModule','myPhotoModule','angularFileUpload']);


userModule.controller('UserController',['$scope','$window','service','$timeout','FileUploader',function(scope,$window,service,$timeout,FileUploader){
    service.config.backRoute = '';

    service.func.resetTabActive(2);

    var icon = '';

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

    var uploader = scope.uploader = new FileUploader({
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

        var reader = new FileReader();

        reader.onload = onLoadImage;
        reader.readAsDataURL(file);

        function onLoadImage(event) {
            icon = event.target.result;
            service.net.editIcon(icon);
        }
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

    scope.$on(SERVICE_EDIT_ICON,function(event,data){
        console.log(data);
        if(data.success){
            service.net.getUserInfo();
        }else{
            alert('修改头像失败');
        }
    });

    scope.$on(SERVICE_ERROR,function(event){
        //('网络错误');
        //alert('修改头像失败');
    });
}]);

userModule.directive('changeInputHeight',['$timeout', function ($timeout) {
    return {
        link: function ($scope, iElm, iAttrs, controller) {
            $timeout(function () {
                var height = iElm.height();
                $timeout(function () {
                    $('input[type=file]').height(height);
                })
            },200);
        }
    }
}]);

//注销
userModule.directive('logout', ['service', '$timeout', function(service, timeout) {
    return {
        restrict: 'A',
        controller: function($scope, $element, $attrs, $transclude) {
            $scope.$on(SERVICE_LOGOUT, function(event, data) {
                // console.log(data);
                // console.log($element);
                if (data.success) {
                    service.user = {};
                    service.ws.close();
                    $element.text('退出成功');
                } else {
                    $element.text(data.message);
                }
                timeout(function() {
                    $element.button('reset');
                }, 800);
            });

            $scope.$on(SERVICE_ERROR, function(event) {
                $element.text('网络错误');
                timeout(function() {
                    $element.button('reset');
                }, 800);
            });
        },
        link: function($scope, iElm, iAttrs, controller) {
            iElm.bind('click', function() {
                $(this).button('loading');
                service.net.logout();
            });

            // console.log('directive:logout');
        }
    };
}]);

