var nodeUrl = require("url");
//var RpcProtocol = require('../protocol/rpc-protocol.js');
var channel = require('../infrastructure/channel.js');
var uuid = require('node-uuid');
var RSVP = require('rsvp');
require('sexylog');
var handler = require('../infrastructure/handler.js');
var messages = require('../domain/messages.js');


var serviceName;
var protocolName = 'introspect';
exports.getApi = function (name, transport) {
    serviceName = name;

    var api = {
        name: function () {
            return protocolName;
        },
        introspect: function (remoteService, clientCallback) {
            var transChannel = transport.openChannel(remoteService, protocolName);
            var clientChannel = channel.create("client-api");
            var rpcProtocolClientHandler = clientHandler(remoteService);
            clientChannel.rightHandler(rpcProtocolClientHandler);
            transChannel.handler(rpcProtocolClientHandler);

            var promise = new RSVP.Promise(function (resolve, reject) {
                var callback = function (event) {
                    if (!event) {
                        logger.warn('client-api promise failed check! calling promise.reject()');
                        reject(event);
                    } else {
                        logger.trace('promise calling promise.resolve() event.id=' + event.id);
                        resolve(event);
                    }
                };
                if (clientCallback) callback = clientCallback;
                clientChannel.leftConnection().listen(callback);
                logger.info("SENDING DATA DOWN THE WIRE FOR THE AWESOME")
                clientChannel.leftConnection().send({});
            });

            return promise;

        },
        protocolHandler: function () {
            return {
                server: function () {
                    return serverHandler();
                },
                client: function (remoteServiceUrl) {
                    return clientHandler(remoteServiceUrl);
                }
            }
        }
    }
    return api;
}


function clientHandler(remoteService) {
    var TIMEOUT_MS = 10000;
    var responseReceived = false;
    var protocolHandler = handler.create('client-introspect');

    // OUTGOING/DOWNSTREAM event handling protocol logic
    protocolHandler.outgoing(function (requestData, accept, reject, route) {
        logger.info("[*** PROTOCOL:CLIENT:INTROSPECT ***] client protocol outgoing requestData=%s", JSON.stringify(requestData));

        var request = {};
        var muonMessage = messages.muonMessage(request, serviceName, remoteService, "introspectionRequested");
        accept(muonMessage);

        setTimeout(function () {
            if (!responseReceived) {
                logger.info('[*** PROTOCOL:CLIENT:INTROSPECT ***] timeout reached responding with timeout message');
                var timeoutMsg = introspectionRequest("timeout", remoteServiceUrl, {}, {
                    status: 'timeout',
                    message: 'response timeout exceeded'
                });
                reject(timeoutMsg);
            }
        }, TIMEOUT_MS);
    });


    // INCOMING/UPSTREAM  event handling protocol logic
    protocolHandler.incoming(function (introspectionResponse, accept, reject, route) {
        logger.info("[*** PROTOCOL:CLIENT:INTROSPECT ***] protocol incoming event id=" + introspectionResponse.id);
        logger.info("[*** PROTOCOL:CLIENT:INTROSPECT ***] protocol incoming message=%s", JSON.stringify(introspectionResponse));
        responseReceived = true;
        var introspectionReport = messages.decode(introspectionResponse.payload, introspectionResponse.content_type)
        if (introspectionReport.body != undefined) {
            introspectionReport.body = messages.decode(introspectionReport.body, introspectionReport.content_type)
        }
        logger.info("Sending the introspection payload " + introspectionReport)
        accept(introspectionReport);
    });
    //logger.trace('**** rpc proto: '+JSON.stringify(rpcProtocolHandler));
    return protocolHandler;

}


  function serverHandler() {

         var incomingMuonMessage;

        // OUTGOING/DOWNSTREAM event handling protocol logic
         rpcProtocolHandler.outgoing(function(serverResponseData, accept, reject, route) {
                logger.info("[*** PROTOCOL:SERVER:INTROSPECT ***] server protocol outgoing requestData=%s", JSON.stringify(serverResponseData));
                 var serverResponse = {
                      status: 200,
                      body: messages.encode(serverResponseData),
                      content_type: "application/json"
                    };
                 var outboundMuonMessage = messages.muonMessage(serverResponse, serviceName, incomingMuonMessage.origin_service, "request.response");
                accept(outboundMuonMessage);
         });

         // INCOMING/UPSTREAM  event handling protocol logic
         rpcProtocolHandler.incoming(function(msg, accept, reject, route) {
                incomingMuonMessage = msg;
                logger.info("[*** PROTOCOL:SERVER:INTROSPECT ***] rpc protocol incoming event id=" + incomingMuonMessage.id);
                logger.debug("[*** PROTOCOL:SERVER:INTROSPECT ***] rpc protocol incoming message=%s", JSON.stringify(incomingMuonMessage));
                logger.trace("[*** PROTOCOL:SERVER:INTROSPECT ***] rpc protocol incoming message type=%s", (typeof incomingMuonMessage));


                var payload = messages.decode(incomingMuonMessage.payload, incomingMuonMessage.content_type);
                logger.info("[*** PROTOCOL:SERVER:RPC ***] RPC payload =%s", JSON.stringify(payload));

                var endpoint = payload.url;
                payload.body = messages.decode(payload.body, payload.content_type)

                var handler = handlerMappings[endpoint];
                if (! handler) {
                    logger.warn('[*** PROTOCOL:SERVER:RPC ***] NO HANDLER FOUND FOR ENDPOINT: "' + endpoint + '" RETURN 404! event.id=' + incomingMuonMessage.id);
                    payload.status = 404
                    var return404msg = messages.resource404(incomingMuonMessage, payload);
                    reject(return404msg);
                } else {
                    logger.info('[*** PROTOCOL:SERVER:RPC ***] Handler found for endpoint "'+ endpoint + '" event.id=' + incomingMuonMessage.id);

                    route(payload, endpoint);

                }
         });
         return rpcProtocolHandler;

}


function introspectionRequest(statusCode, url, body, error) {
    if (!body) body = {};
    if (!error) error = {};
    if (!statusCode) {
        var error = new Error('introspectionRequest() invalid status: "' + statusCode + '"');
        logger.error(error);
        throw error;
    }
    var rpcMsg = {
        body: body,
        statusCode: statusCode,
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
        var error = new Error('introspectionRequest() invalid status: "' + statusCode + '"');
        logger.error(error);
        throw error;
    }
    var rpcMsg = {
        body: body,
        statusCode: statusCode,
        url: url,
        error: error,
        endpoint: function () {
            return nodeUrl.parse(url, true).path;
        }
    }
    return rpcMsg;
}
