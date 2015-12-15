

exports.init = function(url, servicename) {

    var api = {
        query: function(endpoint, params, callback) {
            var headers = params;
            platform.send(endpoint, headers, payload, callback);
        },
        command: function(endpoint, payload, callback) {
            var headers = {};
            platform.send(endpoint, headers, payload, callback);
        },
        onQuery: function(endpoint, callback) {
            var headers = {};
            platform.registerEndpoint(endpoint, callback);
        },
        onCommand: function(endpoint, callback) {
            var headers = {};
            platform.registerEndpoint(endpoint, callback);
        }
    };

    return api;
};