'user strict';


var loginModule = angular.module('loginModule', ['serviceModule', 'angularFileUpload']);

loginModule.controller('LoginController', ['$scope', 'service', 'FileUploader', function (scope, service, FileUploader) {
    scope.showIndex = 0;

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

    scope.constellation = ["白羊座","金牛座","双子座","巨蟹座","狮子座","处女座","天平座","天蝎座","射手座","魔蝎座","水瓶座","双鱼座"];

}]);

loginModule.factory('loginService', ['$rootScope', 'service', '$http', function (rootScope, service, http) {
    var service = {};

    return service;
}]);

//登录
loginModule.directive('login', ['service', '$timeout', function (service, timeout) {
    return {
        restrict: 'A',
        controller: function ($scope, $element, $attrs, $transclude) {
            $scope.$on(SERVICE_LOGIN, function (event, data) {
                 //console.log(data);
                // //console.log($element);
                if (data.success) {
                    service.func.loadUserData(data);
                    service.net.getWSToken();
                    $element.text('登录成功');
                    timeout(function () {
                        $('#modal-login').modal('hide');
                        if(service.config.albumList.length>1){
                            service.net.isGood(service.config.albumList[2].photo_id);
                        }
                    }, 300);
                } else {
                    $element.text(data.message);
                }
                timeout(function () {
                    $element.button('reset');
                }, 800);
            });

            $scope.$on(SERVICE_ERROR, function (event) {
                $element.text('网络错误');
                timeout(function () {
                    $element.button('reset');
                }, 800);
            });


            $scope.$on(SERVICE_WS_TOKEN, function (event, data) {
                 //console.log(data);
                if (data.success) {
                    service.user.token = data.message.token;
                    service.net.connectWS();
                }
            });
        },
        link: function ($scope, iElm, iAttrs, controller) {
            iElm.bind('click', function () {
                $(this).button('loading');
                service.net.login();
            });

            angular.element('#modal-login').bind('show.bs.modal', function (e) {
                $scope.$apply(function () {
                    $scope.showIndex = 0;
                });

            });


            //console.log('directive:login');
        }
    };
}]);

loginModule.directive('sendCode', ['$rootScope', 'loginService', 'service', '$timeout', function (rootScope, loginService, service, timeout) {

    function countDown(element, time) {
        time = parseInt(time);
        element.text(time);
        clearInterval(t);
        var t = setInterval(function () {
            if (time != NaN && service.func.validationType(time, 0)) {
                if (time > 60)time = 60;
                if (time < 1) {
                    clearInterval(t);
                    element.button('reset');
                } else {
                    time--;
                    element.text(time);
                }
            }
        }, 1000);
    }

    return {
        controller: function ($scope, $element, $attrs, $transclude) {
            $scope.$on(SERVICE_SEND_CODE, function (event, data) {
                console.log(data.message);
                if (data.success) {
                    //alert(data.message);
                    countDown($element, 60);
                } else {
                    var msg = data.message;
                    if (msg != NaN && service.func.validationType(msg, 0)) {
                        countDown($element, msg);
                    } else if (msg != NaN) {
                        $element.text(msg);
                        timeout(function () {
                            $element.button('reset');
                        }, 1000);

                    }
                }
            });
            $scope.$on(SERVICE_SEND_RESET_CODE, function (event, data) {
                console.log(data.message);
                if (data.success) {
                    alert(data.message);
                    countDown($element, 60);
                } else {
                    var msg = data.message;
                    if (msg != NaN && service.func.validationType(msg, 0)) {
                        countDown($element, msg);
                    } else if (msg != NaN) {
                        $element.text(msg);
                        timeout(function () {
                            $element.button('reset');
                        }, 1000);

                    }
                }
            });
            $scope.$on(SERVICE_ERROR, function (event) {
                $element.text('网络错误');
                timeout(function () {
                    $element.button('reset');
                }, 800);
            });
        },
        link: function ($scope, iElm, iAttrs, controller) {
            iElm.bind('click', function () {
                var phone = $scope.mobile;
                if($scope.showIndex==1){
                    service.net.sendCode(phone);
                }else if($scope.showIndex == 4){
                    service.net.sendResetCode(phone);
                }

                $(this).button('loading');
                iElm.text('发送中');
            });
        }
    }
}]);

loginModule.directive('vertifyCode', ['service', '$timeout', function (service, timeout) {
    return {
        controller: function ($scope, $element, $attrs, $transclude) {
            $scope.$on(SERVICE_VERTIFY_CODE, function (event, data) {
                //console.log(data.message);

                if (data.success) {
                    $scope.showIndex = 2;
                } else {
                    $element.text(data.message);
                }

                timeout(function () {
                    $element.button('reset');
                }, 1000);
            });
            $scope.$on(SERVICE_VERTIFY_RESET_CODE, function (event, data) {
                //console.log(data.message);

                if (data.success) {
                    $scope.showIndex = 3;
                } else {
                    $element.text(data.message);
                }

                timeout(function () {
                    $element.button('reset');
                }, 1000);
            });
            $scope.$on(SERVICE_ERROR, function (event) {
                $element.text('网络错误');
                timeout(function () {
                    $element.button('reset');
                }, 800);
            });
        },
        link: function ($scope, iElm, iAttrs, controller) {
            iElm.bind('click', function () {
                var phone = $scope.mobile;
                var code = $scope.code;
                if($scope.showIndex==1){
                    service.net.vertifyCode(phone, code);
                }else if($scope.showIndex == 4){
                    service.net.vertifyResetCode(phone,code);
                }

                $(this).button('loading');
                iElm.text('发送中');
            });
        }
    }
}]);

loginModule.directive('ngThumb', ['$window', function ($window) {
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

    return {
        link: function ($scope, iElm, iAttrs) {
            if (!helper.support) return;

            var params = $scope.$eval(iAttrs.ngThumb);

            if (!helper.isFile(params.file)) return;
            if (!helper.isImage(params.file)) return;

            var reader = new FileReader();

            reader.onload = onLoadImage;
            reader.readAsDataURL(params.file);

            iElm.context.onload = function () {
                iElm.height('80px');
            }
            function onLoadImage(event) {
                iElm.context.src = event.target.result;
            }

        }
    };
}]);

loginModule.directive('modifyPassword',['$timeout','service','$location', function ($timeout, service,$location) {
    return {
        controller: function ($scope, $element, $attrs, $transclude) {
            $scope.$on(SERVICE_MODIFY_PWD,function(event,data){
                if(data.success){
                    $element.text("修改成功");
                    //timeout(function(){
                    //    angular.element('#modal-login').modal('hide');
                    //},500);
                    $scope.mobile = '';
                    $scope.code = '';
                    $scope.pwd = '';
                    $scope.pwd2 = '';
                    window.location.reload();

                }else{
                    $element.text(data.message);
                }

                $timeout(function(){
                    $element.button('reset');
                    if(data.success)$scope.showIndex = 0;
                },800);
            });
            $scope.$on(SERVICE_ERROR,function(){
                $element.text("网络错误");
                $timeout(function(){
                    $element.button('reset');
                },800);
            });
        },
        link: function ($scope, iElm, iAttrs, controller) {
            iElm.bind('click', function () {
                service.net.modifyPwd($scope.mobile,$scope.code,$scope.pwd);
            })
        }
    }
}]);

loginModule.directive('regist', ['$timeout','service', function (timeout,service) {
    return {
        controller: function ($scope, $element, $attrs, $transclude) {
            $scope.$on(SERVICE_REGIST,function(event,data){
                if(data.success){
                    service.func.loadUserData(data);
                    service.net.getWSToken();
                    $element.text("注册成功");
                    timeout(function(){
                        angular.element('#modal-login').modal('hide');
                    },500);

                }else{
                    $element.text(data.message);
                }

                timeout(function(){
                    $element.button('reset');
                },800);
            });

            $scope.$on(SERVICE_ERROR,function(){
                $element.text("网络错误");
                timeout(function(){
                    $element.button('reset');
                },800);
            });

        },
        link: function ($scope, iElm, iAttrs) {
            /*iElm.bind('click', function () {
                service.net.regist($scope.mobile,$scope.code,$scope.nickname,$scope.sex,$scope.birthday,$scope.height,angular.element('#icon').attr('src'),$scope.pwd);
                iElm.button('loading');
            });*/
iElm.bind('click', function () {
			iElm.button('loading');
                if($scope.registFrom.$invalid){

                    var err = "注册失败";

                    if(!$scope.pwd)err = "请输入密码";
                    if($scope.pwd != $scope.pwd2)err = "两次密码输入不一样";
                    if(!$scope.star)err = "请选择星座";
                    if(!$scope.nickname)err = "昵称不可用";
                    if($scope.sex == undefined)err = "请选择性别";
                    if(!angular.element('#icon').attr('src'))err = "请上传头像";

                    timeout(function(){
                        iElm.text(err);
                    },10);

                    timeout(function(){
                        iElm.button('reset');
                    },2000);

                }else{
                    service.net.regist($scope.mobile,$scope.code,$scope.nickname,$scope.sex,$scope.star,$scope.height,angular.element('#icon').attr('src'),$scope.pwd);
                }
            });
        }
    };
}]);

