var amqp = require('../../../muon/transport/rabbit/amqp-api.js');
var RSVP = require('rsvp');
require('sexylog');
var helper = require('./transport-helper.js');
var bichannel = require('../../../muon/infrastructure/channel.js');
var uuid = require('node-uuid');
var messages = require('../../domain/messages.js');

var errCallback;

exports.connect = function(serviceName, url, discovery) {
    var clientChannel = bichannel.create(serviceName + "-amqp-transport-client");

    amqp.connect(url).then(function(api) {
        logger.debug('[*** TRANSPORT:CLIENT:BOOTSTRAP ***] connected to amqp-api');
        var handshakeId = uuid.v4();
        var serviceQueueName = helper.serviceNegotiationQueueName(serviceName);
        var serverListenQueueName = serviceName + ".listen." + handshakeId;
        var replyQueueName = serviceName + ".reply." + handshakeId;
        var handshakeMsg = messages.handshakeRequest('request', serviceName, serverListenQueueName, replyQueueName);
        logger.trace('[*** TRANSPORT:CLIENT:BOOTSTRAP ***] preparing to handshake...');
        RSVP.resolve()
        .then(findService(serviceName, discovery))
        .then(sendHandshake(serviceQueueName, handshakeMsg, api))
        .then(readyInboundSocket(replyQueueName, api, clientChannel.rightConnection()))
        .then(readyOutboundSocket(serverListenQueueName, api, clientChannel.rightConnection()))
        .catch(function(err) {
             var negotiationErr = new Error(err);
             logger.error(err.stack);
             errCallback(err);
        });
     }).catch(function(err) {
         logger.error(err.stack);
         errCallback(err);
     });

    return clientChannel.leftConnection();
};

exports.onError = function(callback) {
    errCallback =callback;
}


var findService = function(serviceName, discovery) {
  logger.info("[*** TRANSPORT:CLIENT:DISCOVERY ***] preparing to find service '" + serviceName + "'");
  return function(prevResult) {
     var promise = new RSVP.Promise(function(resolve, reject) {
        var attempts = 0;
        var serviceFinder = setInterval(function () {
                attempts++;
                var maxattempts = 5;
                var serviceFound = false;
                logger.info("[*** TRANSPORT:CLIENT:DISCOVERY ***] looking for muon service '" + serviceName + "' attempts=" + attempts);
                discovery.discoverServices(function(services) {
                        var service = services.find(serviceName);
                        logger.debug("[*** TRANSPORT:CLIENT:DISCOVERY ***] found services: '" + JSON.stringify(services) + "'");
                        if (service) {
                            logger.info("[*** TRANSPORT:CLIENT:DISCOVERY ***] found service: '" + JSON.stringify(service) + "'");
                            serviceFound = true;
                            resolve(service);
                        } else if (attempts > maxattempts) {
                            logger.warn("[*** TRANSPORT:CLIENT:DISCOVERY ***] unable to find service '" + serviceName + "' after " + attempts + " attempts. aborting. reject()");
                            reject(new Error('unable to find muon service ' + serviceName));
                        } else {
                            logger.warn("[*** TRANSPORT:CLIENT:DISCOVERY ***] unable to find service '" + serviceName + "'");
                        }

                        if (attempts > maxattempts || serviceFound) {
                            clearInterval(serviceFinder);
                        }
                 });

        }, 1000);

     });
     return promise;
  }
}


var sendHandshake = function(serviceQueueName, handshakeMsg, amqpApi) {
  //console.log('sendHandshake() called');
  return function(prevResult) {
    //console.log('sendHandshake() returning promise');
     var promise = new RSVP.Promise(function(resolve, reject) {
        //console.log('sendHandshake() promise executing sending payload ' + JSON.stringify(handshakeMsg));
        var channel = amqpApi.outbound(serviceQueueName).send(handshakeMsg);
        logger.info("[*** TRANSPORT:CLIENT:HANDSHAKE ***] handshake message sent on queue '" + serviceQueueName + "'");
        resolve();
     });
     return promise;
  }
}


var readyInboundSocket = function(recvQueueName, amqpApi, clientChannel) {

     return function(prevResult) {
        var promise = new RSVP.Promise(function(resolve, reject) {
            logger.debug("[*** TRANSPORT:CLIENT:INBOUND ***] waiting for muon replies on queue '" + recvQueueName + "'");

            amqpApi.inbound(recvQueueName).listen(function(message) {
                 messages.validate(message);
                 if ( messages.isHandshakeAccept(message)) {
                    // we're got a handshake confirmation and are now connected to the remote service
                     logger.trace("[*** TRANSPORT:CLIENT:HANDSHAKE ***]  client received negotiation response message %s", JSON.stringify(message));
                     logger.info("[*** TRANSPORT:CLIENT:HANDSHAKE ***] client/server handshake protocol completed successfully");
                     resolve();
                } else {
                     logger.debug("[*** TRANSPORT:CLIENT:INBOUND ***]  client received muon event %s", JSON.stringify(message));
                     clientChannel.send(message);
                }
            });
         });
         return promise;
     }
}


var readyOutboundSocket = function(serviceQueueName, amqpApi, clientChannel) {

     return function(prevResult) {
         var promise = new RSVP.Promise(function(resolve, reject) {
            clientChannel.listen(function(message){
                messages.validate(message);
                logger.debug("[*** TRANSPORT:CLIENT:OUTBOUND ***] send on queue " + serviceQueueName + "  message=", JSON.stringify(message));
                amqpApi.outbound(serviceQueueName).send(message);
            });
            logger.info('[*** TRANSPORT:CLIENT:HANDSHAKE ***] readyOutboundSocket success');
            resolve();
         });
         logger.debug("[*** TRANSPORT:CLIENT:OUTBOUND ***] outbound socket ready on amqp queue  '%s'", serviceQueueName);
         return promise;
      }
}




