"use strict";

var nodeUrl = require("url");
var channel = require('../infrastructure/channel.js');
var uuid = require('node-uuid');
var RSVP = require('rsvp');
require('sexylog');
var messages = require('../domain/messages.js');


var handlerMappings = {};
var serviceName;
var protocolName = 'event';
exports.getApi = function (name, infrastructure) {
    serviceName = name;

    var api = {
        name: function () {
            return protocolName;
        },
        emit: function (event) {

            var promise = new RSVP.Promise(function (resolve, reject) {

                var transportPromise = infrastructure.getTransport();
                transportPromise.then(function (transport) {

                    infrastructure.discovery.discoverServices(function (services) {
                        var eventStore = services.findServiceWithTags("eventstore")

                        if (!eventStore) {
                            reject({
                                eventTime: null,
                                orderId: null,
                                status: "FAILED",
                                cause: "No event store could be found, is Photon running?"
                            })
                            return
                        }

                        var transChannel = transport.openChannel(eventStore.identifier, protocolName);

                        var callback = function (resp) {
                            if (!resp) {
                                logger.warn('client-api promise failed check! calling promise.reject()');
                                reject(resp);
                            } else {
                                logger.trace('promise calling promise.resolve() event.id=' + resp.id);
                                var payload = messages.decode(resp.payload)
                                logger.debug("EVENT Incoming message is " + JSON.stringify(payload))
                                resolve(payload);
                            }
                        };

                        var evMessage = messages.muonMessage(event, serviceName, eventStore.identifier, protocolName, "EventEmitted");

                        transChannel.listen(callback);
                        transChannel.send(evMessage);
                    });
                });
            });


            return promise;
        }
    }
    return api;
}

function clientHandler(remoteServiceUrl) {
    var TIMEOUT_MS = 2500;
    var responseReceived = false;
    var remoteService = nodeUrl.parse(remoteServiceUrl, true).hostname;

    class RpcProtocolHandler extends Handler {

        outgoingFunction(message, forward, back, route, close) {
            logger.debug("[*** PROTOCOL:CLIENT:RPC ***] client rpc protocol outgoing message=%s", JSON.stringify(message));
            var request = {
                url: remoteServiceUrl,
                body: messages.encode(message),
                content_type: "application/json"
            };
            var muonMessage = messages.muonMessage(request, serviceName, remoteService, protocolName, "request.made");
            logger.trace("[*** PROTOCOL:CLIENT:RPC ***] client rpc protocol outgoing muonMessage=%s", JSON.stringify(muonMessage));
            forward(muonMessage);

            setTimeout(function () {
                if (!responseReceived) {
                    logger.info('[*** PROTOCOL:CLIENT:RPC ***] timeout reached responding with timeout message');
                    var timeoutMsg = createRpcMessage("timeout", remoteServiceUrl, {}, {
                        status: 'timeout',
                        body: 'rpc response timeout exceeded'
                    });
                    back(timeoutMsg);
                    close('client_outgoing');
                }
            }, TIMEOUT_MS);
        }


        incomingFunction(message, forward, back, route, close) {

            logger.info("[*** PROTOCOL:CLIENT:RPC ***] rpc protocol incoming message id=" + message.id);
            logger.debug("[*** PROTOCOL:CLIENT:RPC ***] rpc protocol incoming message=%s", JSON.stringify(message));
            if (message.channel_op == 'closed') {
                shutdown();
                var msg;
                if (message.step.includes("noserver") ) {
                    msg = createRpcMessage("noserver", remoteServiceUrl, {}, {
                        status: 'closed',
                        body: 'server cannot be found'
                    });
                } else {
                    msg = createRpcMessage("closed", remoteServiceUrl, {}, {
                        status: 'closed',
                        body: 'rpc socket closed by muon'
                    });
                }
                forward(msg);
                return;
            }

            responseReceived = true;
            var rpcMessage = messages.decode(message.payload, message.content_type)
            if (rpcMessage.body != undefined) {
                rpcMessage.body = messages.decode(rpcMessage.body, rpcMessage.content_type)
            }
            logger.info("Sending the response payload " + JSON.stringify(rpcMessage));
            forward(rpcMessage);
            close('client_incoming');
        }

    }
    ; //RpcProtocolHandler


    var rpcProtocolHandler = new RpcProtocolHandler('client-rpc');
    return rpcProtocolHandler;

}


function shutdown() {
    logger.warn('rpc protocol shutdown() called');
}


function createRpcMessage(statusCode, url, body, error) {
    if (!body) body = {};
    if (!error) error = {};
    if (!statusCode) {
        var error = new Error('rpcMessage() invalid status: "' + statusCode + '"');
        logger.error(error);
        throw error;
    }
    var rpcMsg = {
        id: 'rpc-gen',
        body: body,
        status: statusCode,
        url: url,
        error: error,
        endpoint: function () {
            return nodeUrl.parse(url, true).path;
        }
    }
    return rpcMsg;
}

function rpcRequest(statusCode, url, body, error) {
    if (!body) body = {};
    if (!error) error = {};
    if (!statusCode) {
        var error = new Error('rpcMessage() invalid status: "' + statusCode + '"');
        logger.error(error);
        throw error;
    }
    var rpcMsg = {
        body: body,
        status: statusCode,
        url: url,
        error: error,
        endpoint: function () {
            return nodeUrl.parse(url, true).path;
        }
    }
    return rpcMsg;
}
