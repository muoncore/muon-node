var nodeUrl = require("url");
//var RpcProtocol = require('../protocol/rpc-protocol.js');
var channel = require('../infrastructure/channel.js');
var uuid = require('node-uuid');
var RSVP = require('rsvp');
require('sexylog');
var handler = require('../infrastructure/handler.js');
var messages = require('../domain/messages.js');


var handlerMappings = {};
var serviceName;
exports.getApi = function(name, transport) {
    serviceName = name;

    var api = {
        request: function(remoteServiceUrl, data, clientCallback) {
           var serviceRequest = nodeUrl.parse(remoteServiceUrl, true);
           var transChannel = transport.openChannel(serviceRequest.hostname, 'request');
           var clientChannel = channel.create("client-api");
           var rpcProtocolClientHandler = clientHandler(remoteServiceUrl);
           clientChannel.rightHandler(rpcProtocolClientHandler);
           transChannel.handler(rpcProtocolClientHandler);

           var promise = new RSVP.Promise(function(resolve, reject) {
                var callback = function(event) {
                        if (! event) {
                            logger.warn('client-api promise failed check! calling promise.reject()');
                            reject(event);
                        } else {
                            logger.trace('promise calling promise.resolve() event.id=' + event.id);
                            resolve(event);
                        }
                };
                if (clientCallback) callback = clientCallback;

                clientChannel.leftConnection().listen(callback);
                clientChannel.leftConnection().send(data);
            });

            return promise;

        },
        handle: function(endpoint, callback) {
            logger.debug('[*** API ***] registering handler endpoint: ' + endpoint);
            handlerMappings[endpoint] = callback;
        },
        protocolHandler: function() {
            return {
                server: function() {
                    return serverHandler();
                },
                client: function() {
                    return clientHandler();
                }
            }
        }
    }
    return api;
}





function serverHandler() {

         var rpcProtocolHandler = handler.create('server-rpc', handlerMappings);

         var incomingMuonMessage;
         //

        // OUTGOING/DOWNSTREAM event handling protocol logic
         rpcProtocolHandler.outgoing(function(serverResponse, accept, reject, route) {
                logger.info("[*** PROTOCOL:SERVER:RPC ***] server rpc protocol outgoing requestData=%s", JSON.stringify(serverResponse));
                
                var response = {
                    payload:serverResponse,
                    status:200
                }
             
                 var outboundMuonMessage = messages.muonMessage(response, serviceName, 'rpc://' + incomingMuonMessage.origin_service + '', "request.response");
                accept(outboundMuonMessage);
         });

         // INCOMING/UPSTREAM  event handling protocol logic
         rpcProtocolHandler.incoming(function(msg, accept, reject, route) {
                incomingMuonMessage = msg;
                logger.info("[*** PROTOCOL:SERVER:RPC ***] rpc protocol incoming event id=" + incomingMuonMessage.id);
                logger.info("[*** PROTOCOL:SERVER:RPC ***] rpc protocol incoming message=%s", JSON.stringify(incomingMuonMessage));
             
                var payload = JSON.parse(new Buffer(incomingMuonMessage.payload).toString());
                logger.info("[*** PROTOCOL:SERVER:RPC ***] RPC payload =%s", JSON.stringify(payload));

                var endpoint = payload.headers.url;
                var handler = handlerMappings[endpoint];
                if (! handler) {
                    logger.warn('[*** PROTOCOL:SERVER:RPC ***] NO HANDLER FOUND FOR ENDPOINT: "' + endpoint + '" RETURN 404! event.id=' + incomingMuonMessage.id);
                    var return404msg = messages.resource404(incomingMuonMessage);
                    reject(return404msg);
                } else {
                    logger.info('[*** PROTOCOL:SERVER:RPC ***] Handler found for endpoint "'+ endpoint + '" event.id=' + incomingMuonMessage.id);

                      var rpcMessage = {
                            status: incomingMuonMessage.status,
                            requestUrl: endpoint,
                            body: payload,
                            error: ''
                        }

                    route(rpcMessage, endpoint);

                }
         });
         return rpcProtocolHandler;

}



function clientHandler(remoteServiceUrl) {
        TIMEOUT_MS = 10000;
        var responseReceived = false;
         var rpcProtocolHandler = handler.create('client-rpc');

        // OUTGOING/DOWNSTREAM event handling protocol logic
         rpcProtocolHandler.outgoing(function(requestData, accept, reject, route) {
                logger.info("[*** PROTOCOL:CLIENT:RPC ***] server rpc protocol outgoing requestData=%s", JSON.stringify(requestData));
                 var muonMessage = messages.muonMessage(requestData, serviceName, remoteServiceUrl, "request.made");
                accept(muonMessage);

                setTimeout(function () {
                    if (! responseReceived) {
                          logger.info('[*** PROTOCOL:CLIENT:RPC ***] timeout reached responding with timeout message');
                          var timeoutMsg = rpcMessage("timeout", remoteServiceUrl, {}, {status: 'timeout', message: 'rpc response timeout exceeded'});
                          reject(timeoutMsg);
                    }
                }, TIMEOUT_MS);
         });

         // INCOMING/UPSTREAM  event handling protocol logic
         rpcProtocolHandler.incoming(function(muonMessage, accept, reject, route) {
                logger.info("[*** PROTOCOL:CLIENT:RPC ***] rpc protocol incoming event id=" + muonMessage.id);
                logger.info("[*** PROTOCOL:CLIENT:RPC ***] rpc protocol incoming message=%s", JSON.stringify(muonMessage));
                responseReceived = true;
               if (muonMessage.payload.status === '404') {
                    var errorResponse = {
                        status: muonMessage.payload.status,
                        requestUrl: muonMessage.url,
                        body: {},
                        error: muonMessage.payload
                    }
                    accept(errorResponse);
                } else {
                    var response = {
                        status: muonMessage.status,
                        requestUrl: muonMessage.url,
                        body: muonMessage.payload,
                        error: ''
                    }
                    accept(response);
                }
         });
         //logger.trace('**** rpc proto: '+JSON.stringify(rpcProtocolHandler));
         return rpcProtocolHandler;

}




function rpcMessage(statusCode, requestUrl, payload, error) {
    if (! payload) payload = {};
    if (! error) error = {};
    if (! statusCode)  {
        var error = new Error('rpcMessage() invalid status: "' + statusCode + '"');
        logger.error(error);
        throw error;
    }
    var rpcMsg = {
        body: payload,
        statusCode: statusCode,
         requestUrl: requestUrl,
        error: error
    }
    return rpcMsg;
}
