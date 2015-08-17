
var uuid = require('node-uuid');
var _ = require("underscore");
var signals = require("signals");

//TODO - add prioritisation feature

module.exports = function(serviceIdentifier, discoveryService, tags) {

    module.tags = tags;
    module.discoveryService = discoveryService;
    module.transports = [];
    module.serviceIdentifier = serviceIdentifier;
    module.ready = new signals.Signal();
    module.isReady = false;

    setTimeout(function() {
        module.isReady = true;
        module.ready.dispatch();
        logger.info("Becoming ready");
    }, 4000);

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
        onReady: function(callback) {
            readyWait(callback);
        },
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
                if (headers == null) {
                    headers = {"Content-Type":"application/json"};
                }
                _emit({
                    name: eventName,
                    headers: headers,
                    payload: payload
                });
            }
        },
        resource: {
            onQuery: function (resource, doc, callback) {
                    _listenOnResource(resource, "query", callback);
            },
            onCommand: function (resource, doc, callback) {
                _listenOnResource(resource, "command", callback);
            },
            query: function (url, callback, resource) {
                resource = resource || {};
                _sendAndWaitForReply({
                    url: url,
                    payload: resource,
                    method: "query"
                }, callback);
            },
            command: function (url, payload, callback) {
                _sendAndWaitForReply({
                    url: url,
                    payload: payload,
                    method: "command"
                }, callback);
            }
        },
        stream: {
            provideStream: function(streamName, stream) {
                checkReady();
                //TODO, transport discovery
                module.transports[0].stream.provideStream(streamName, stream);
            },
            subscribe: function(streamUri, callback) {
                checkReady();
                //TODO, transport discovery
                module.transports[0].stream.subscribe(streamUri, callback);
            }
        },
        discoverServices: function (callback) {
            checkReady();
            module.discoveryService.discoverServices(callback);
        }
    };

    /*
    These do practically all the same thing?
     */

    function _listenOnBroadcast(event, callback) {
        readyWait(function() {
            var transports = module.transports;

            for(var i=0; i<transports.length; i++) {
                var transport = transports[i];
                transport.broadcast.listenOnBroadcast(event, callback);
            }
        });

    }

    function _emit(payload) {
        readyWait(function() {
            var transports = module.transports;

            for(var i=0; i<transports.length; i++) {
                var transport = transports[i];
                transport.broadcast.emit(payload);
            }
        });
    }

    function _listenOnResource(resource, method, callback) {
        readyWait(function() {
            var transports = module.transports;
            for(var i=0; i<transports.length; i++) {
                var transport = transports[i];
                transport.resource.listenOnResource(resource, method, callback);
            }
        });
    }

    function _sendAndWaitForReply(payload, callback) {
        readyWait(function() {
            //TOD, pick the 'best' transport and only send on that one.
            var transports = module.transports;
            for(var i=0; i<transports.length; i++) {
                var transport = transports[i];
                transport.resource.sendAndWaitForReply(payload, callback);
            }
        });
    }

    function checkReady() {
        if (!module.isReady) {
            logger.error("Muon instance is not yet ready, and cannot be interacted with. Use onReady");
            throw new Error("Muon instance is not yet ready, and cannot be interacted with. Use onReady");
        }
    }

    function readyWait(callback) {
        if (module.isReady) {
            callback();
        } else {
            module.ready.add(callback);
        }
    }


    return scope;


};
