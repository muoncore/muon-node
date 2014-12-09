
var uuid = require('node-uuid');

module.exports = function(serviceIdentifier) {

    module.transports = [];
    module.serviceIdentifier = serviceIdentifier;

    return {
        addTransport: function (transport) {
            //todo, verify the transport.
            transport.setServiceIdentifier(serviceIdentifier);
            module.transports.push(transport);
        },
        onBroadcast: function (event, callback) {
            var transport = module.transports[0];
            transport.listenOnBroadcast(event, callback);
        },
        onGet: function (resource, doc, callback) {
            var transport = module.transports[0];
            transport.listenOnResource(resource, "get", callback);
        },
        onPost: function (resource, doc, callback) {
            var transport = module.transports[0];
            transport.listenOnResource(resource, "post", callback);
        },
        onPut: function (resource, doc, callback) {
            var transport = module.transports[0];
            transport.listenOnResource(resource, "put", callback);
        },
        onDelete: function (resource, doc, callback) {
            var transport = module.transports[0];
            transport.listenOnResource(resource, "delete", callback);
        },
        get: function (url, callback) {
            var transport = module.transports[0];
            transport.sendAndWaitForReply({
                url: url,
                payload: {},
                method: "get"
            }, callback);
        },
        put: function (url, payload, callback) {
            var transport = module.transports[0];
            transport.sendAndWaitForReply({
                url: url,
                payload: payload,
                method: "put"
            }, callback);
        },
        post: function (url, payload, callback) {
            var transport = module.transports[0];
            transport.sendAndWaitForReply({
                url: url,
                payload: payload,
                method: "post"
            }, callback);
        },
        del: function (url, payload, callback) {
            var transport = module.transports[0];
            transport.sendAndWaitForReply({
                url: url,
                payload: payload,
                method: "delete"
            }, callback);
        },
        emit: function (eventName, headers, payload) {
            var transport = module.transports[0];
            transport.emit({
                name: eventName,
                headers: headers,
                payload: payload
            });
        },
        discoverServices: function (callback) {
            //todo, fork, join style on the various transports in parallel.
            var transport = module.transports[0];
            transport.discoverServices(callback);
        }
    }
};
