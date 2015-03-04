
var uuid = require('node-uuid');
var _ = require("underscore");

//TODO - add prioritisation feature

module.exports = function(serviceIdentifier, discoveryService, tags) {

    module.tags = tags;
    module.discoveryService = discoveryService;
    module.transports = [];
    module.serviceIdentifier = serviceIdentifier;

    function generateDescriptor() {
        return {
            "identifier": module.serviceIdentifier,
            "tags": module.tags,

            "resourceConnections":  _.collect(
                _.filter(module.transports, function(it) {
                    return !!("resource" in it);
                }), function(it) {
                    return it.getUrl();
                }),

            "stream": _.collect(
                _.filter(module.transports, function(it) {
                    return !!("stream" in it);
                }), function(it) {
                    return it.getUrl();
                })
        };
    }

    var scope = {
        addTransport: function (transport) {
            //todo, verify the transport.
            //var transport = module.transports[0];
            transport.setServiceIdentifier(serviceIdentifier);
            module.transports.push(transport);
            module.discoveryService.clearAnnouncements();
            module.discoveryService.announceService(generateDescriptor());

        },
        broadcast: {
            on: function (event, callback) {
                _listenOnBroadcast(event, callback);
            },
            emit: function (eventName, headers, payload) {
                //var transport = module.transports[0];
                _emit({
                    name: eventName,
                    headers: headers,
                    payload: payload
                });
            }
        },
        resource: {
            onGet: function (resource, doc, callback) {
                _listenOnResource(resource, "get", callback);
            },
            onPost: function (resource, doc, callback) {
                _listenOnResource(resource, "post", callback);
            },
            onPut: function (resource, doc, callback) {
                _listenOnResource(resource, "put", callback);
            },
            onDelete: function (resource, doc, callback) {
                _listenOnResource(resource, "delete", callback);
            },
            get: function (url, callback) {
                _sendAndWaitForReply({
                    url: url,
                    payload: {},
                    method: "get"
                }, callback);
            },
            put: function (url, payload, callback) {
                _sendAndWaitForReply({
                    url: url,
                    payload: payload,
                    method: "put"
                }, callback);
            },
            post: function (url, payload, callback) {
                _sendAndWaitForReply({
                    url: url,
                    payload: payload,
                    method: "post"
                }, callback);
            },
            del: function (url, payload, callback) {

                _sendAndWaitForReply({
                    url: url,
                    payload: payload,
                    method: "delete"
                }, callback);
            }
        },
        queue: {
            listen: function(queueName, callback) {
                //TODO, transport discovery
                module.transports[0].queue.listen(queueName, callback);
            },
            send: function(queueName, event) {
                //TODO, transport discovery
                module.transports[0].queue.send(queueName, event);
            }
        },
        discoverServices: function (callback) {
            module.discoveryService.discoverServices(callback);
        }
    };

    /*
    These do practically all the same thing?
     */

    function _listenOnBroadcast(event, callback) {
        var transports = module.transports;

        for(var i=0; i<transports.length; i++) {
            var transport = transports[i];
            transport.broadcast.listenOnBroadcast(event, callback);
        }

    }

    function _emit(payload) {
        var transports = module.transports;

        for(var i=0; i<transports.length; i++) {
            var transport = transports[i];
            transport.broadcast.emit(payload);
        }
    }

    function _listenOnResource(resource, method, callback) {
        var transports = module.transports;
        for(var i=0; i<transports.length; i++) {
            var transport = transports[i];
            transport.resource.listenOnResource(resource, method, callback);
        }
    }

    function _sendAndWaitForReply(payload, callback) {
        var transports = module.transports;
        for(var i=0; i<transports.length; i++) {
            var transport = transports[i];
            transport.resource.sendAndWaitForReply(payload, callback);
        }
    }


    return scope;


};
