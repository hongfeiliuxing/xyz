/**
 * Created by SenPng on 15/4/7.
 */

'user strict';
var chatModule = angular.module('chatModule', ['serviceModule','chatRoomModule']);


chatModule.controller('ChatController', ['$scope', 'service', function (scope,service) {
    service.config.backRoute = '';
    service.func.resetTabActive(1);
    service.net.getMessageList();
}]);

chatModule.factory('chatService', ['$http','$rootScope', '$timeout','service', function (http,rootScope,timeout,service) {

    var service = {
        resolve:{
            delay: ['$q', function ($q) {
                var delay = $q.defer();
                timeout(delay.resolve,2000);
                //if(service.config.messageList.length<1){
                //    service.getMessageList();
                //}else{
                //    delay.resolve();
                //}

                return delay.promise;
            }]
        }
    };

    return service;

}]);

