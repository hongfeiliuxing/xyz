/**
 * Created by Administrator on 2015/4/15.
 */

var url = require('url');
module.exports.oauth = function (req) {
	return req.session.user && req.session.user.id;

}