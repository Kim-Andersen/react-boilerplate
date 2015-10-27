var request = require('request'); // https://github.com/request/request
var isOk = require('is-ok');
var telegraph = require('telegraph-events');

var instances = {};

var noop = function(){};

var Factory = {
	create: function(baseUrl){
		if(instances[baseUrl]){
			return instances[baseUrl];
		} else {
			return instances[baseUrl] = new Api(baseUrl);
		}
	}
};

var Api = function(baseUrl){
	var that = this;
	this.baseUrl = baseUrl;
	telegraph(this);

	['get', 'post', 'put', 'del', 'patch'].forEach(function(method){
		that[method] = function(url, body, callback){
			if(!callback && typeof body === 'function'){
				callback = body;
				body = undefined;
			}

			callback = callback || noop;

			var onresponse = function(err) {
				if(err) {
					that.emit('error', err);
					Factory.emit('error', err);
				}
				callback.apply(null, arguments);
			};

			request({
				method: method,
				url: url,
				baseUrl: that.baseUrl,
				body: body,
				json: true
			}, function(err, response, body){
				if(err) return onresponse(err);
				if(!isOk(response, onresponse)) return;

				onresponse(null, body);
			});
		};
	});
};

telegraph(Factory);

module.exports = Factory;