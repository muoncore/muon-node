var handler = require('../infrastructure/handler.js');
var messages = require('../domain/messages.js');


var TIMEOUT_MS = 10000;

exports.newHandler = function(serviceName, remoteServiceUrl) {
        var responded = false;
         var rpcProtocolHandler = handler.create('rpc');
         if (! remoteServiceUrl) remoteServiceUrl = 'temp://server/url';

        // OUTGOING/DOWNSTREAM event handling protocol logic
         rpcProtocolHandler.outgoing(function(requestData, accept, reject) {
                logger.info("[*** PROTOCOL:RPC ***] rpc protocol outgoing requestData=%s", JSON.stringify(requestData));
                 var muonMessage = messages.muonMessage(requestData, serviceName, remoteServiceUrl, "response.sent");
                accept(muonMessage);

                setTimeout(function () {

                    if (! responded) {
                          logger.info('[*** PROTOCOL:RPC ***] timeout reached responding with timeout message');

                          //   messages.clientFailure(data, 'request', 'timeout', 'reach max timeout of ' + TIMEOUT_MS + 'ms requesting url ' + url);
                          var timeoutMsg = {
                               status: 'timeout',
                               requestUrl: remoteServiceUrl,
                               body: {},
                               error: {status: 'timeout', message: 'teimout exceeded'}
                           }
                          //clientChannel.close();
                          reject(timeoutMsg);
                    }

                }, TIMEOUT_MS);
         });

         // INCOMING/UPSTREAM  event handling protocol logic
         rpcProtocolHandler.incoming(function(muonMessage, accept, reject) {
                logger.info("[*** PROTOCOL:RPC ***] rpc protocol incoming event id=" + muonMessage.id);
                logger.info("[*** PROTOCOL:RPC ***] rpc protocol incoming message=%s", JSON.stringify(muonMessage));
                responded = true;
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

