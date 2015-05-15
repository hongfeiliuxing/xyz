function api_user_isLogin(callback) {

//$.post('/users/isLogin',"",function(r){
//    	return callback(r);
//    },'json');

    $.ajax({
        method: 'POST',
        url: '/user/isLogin', success: function (data) {
            //console.log(data);
            return callback(data);
        }
    });

}

function api_user_login(username, password, cb) {
    //$.post('/users/login',{username:username,password:password},function(r){
    //    cb(r);
    //},'json');

    $.ajax({
        method: 'POST',
        url: '/user/login', data: {username: username, password: password}, success: function (data) {
            //console.log(data);
            cb(data);
        }

    });
}

function api_user_logout(cb) {
    $.ajax({
        url: '/user/logout', success: function (data) {
            //console.log(data);
            cb(data);
        }

    });
}

function api_photo_list(cb) {
    $.ajax({
        url: '/photo/list', success: function (data) {
            //console.log(data);
            cb(data);
        }

    });
}

function api_photo(id,cb) {
    $.ajax({
        url: '/photo/info/'+id, success: function (data) {
            //console.log(data);
            cb(data);
        }

    });
}

function api_user_info(cb) {
    $.ajax({
        url: '/user/userinfo', success: function (data) {
            //console.log(data);
            cb(data);
        }

    });
}

function api_user_editinfo(nickname, sex, birthday,icon, favorite_pic, cb) {

    $.ajax({
        method: 'POST',
        url: '/user/edituserinfo',
        data: {nickname: nickname, sex: sex, birthday: birthday,icon:icon, favPhotoId: favorite_pic},
        success: function (data) {
            cb(data);
        }

    });
}