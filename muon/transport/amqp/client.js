var amqp = require('../../../muon/transport/amqp/amqp-api.js');
var RSVP = require('rsvp');
require('sexylog');
var helper = require('./transport-helper.js');
var bichannel = require('../../../muon/infrastructure/channel.js');
var uuid = require('node-uuid');
var messages = require('../../domain/messages.js');

var errCallback;

exports.connect = function(serviceName, protocol, url, discovery) {
    var clientChannel = bichannel.create(serviceName + "-amqp-transport-client");

    amqp.connect(url).then(function(api) {
        //logger.trace('[*** TRANSPORT:CLIENT:BOOTSTRAP ***] connected to amqp-api');
        var handshakeId = uuid.v4();
        var serviceQueueName = helper.serviceNegotiationQueueName(serviceName);
        var serverListenQueueName = serviceName + ".listen." + handshakeId;
        var replyQueueName = serviceName + ".reply." + handshakeId;
        var handshakeHeaders = helper.handshakeRequestHeaders(protocol, serverListenQueueName, replyQueueName);
        logger.trace('[*** TRANSPORT:CLIENT:BOOTSTRAP ***] preparing to handshake...');
        RSVP.resolve()
        .then(findService(serviceName, discovery))
        .then(sendHandshake(serviceQueueName, handshakeHeaders, api))
        .then(readyInboundSocket(replyQueueName, api, clientChannel.rightConnection()))
        .then(readyOutboundSocket(serverListenQueueName, protocol, api, clientChannel.rightConnection()))
        .catch(function(err) {
            logger.error('catch error: ' + err.message);
            if (err.message.indexOf('unable to find muon service') > -1) {

                try {
                    var failureMsg = messages.failure(protocol, 'noserver', 'transport cannot find service "' + serviceName + '"');
                    clientChannel.rightConnection().send(failureMsg);
                } catch (err2) {
                    logger.error(err2.stack);
                    throw new Error(err2);
                }

            } else {
                 var negotiationErr = new Error(err);
                 logger.error(err.stack);
                 errCallback(err);
            }
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
  logger.info("[*** TRANSPORT:CLIENT:DISCOVERY ***] finding service '" + serviceName + "'");
  return function(prevResult) {
      var promise = new RSVP.Promise(function(resolve, reject) {
      var serviceFound = false;
      logger.debug("[*** TRANSPORT:CLIENT:DISCOVERY ***] searching for muon service '" + serviceName);
      discovery.discoverServices(function(services) {
            var service = services.find(serviceName);
            logger.trace("[*** TRANSPORT:CLIENT:DISCOVERY ***] found services: '" + JSON.stringify(services) + "'");
            if (service) {
                logger.info("[*** TRANSPORT:CLIENT:DISCOVERY ***] found service: '" + JSON.stringify(service) + "'");
                serviceFound = true;
                resolve(service);
            } else {
                logger.warn("[*** TRANSPORT:CLIENT:DISCOVERY ***] unable to find service '" + serviceName + " aborting. reject()");
                reject(new Error('unable to find muon service ' + serviceName));
            }
       });
     });
     return promise;
  }
}


var sendHandshake = function(serviceQueueName, handshakeHeaders, amqpApi) {
  //logger.trace('sendHandshake() called');
  return function(prevResult) {
    //logger.trace('sendHandshake() returning promise');
     var promise = new RSVP.Promise(function(resolve, reject) {
        //console.log('sendHandshake() promise executing sending data ' + JSON.stringify(handshakeHeaders));
        var channel = amqpApi.outbound(serviceQueueName).send({data: {}, headers: handshakeHeaders});
        logger.info("[*** TRANSPORT:CLIENT:HANDSHAKE ***] handshake message sent on queue '" + serviceQueueName + "'");
        resolve();
     });
     return promise;
  }
}


var readyInboundSocket = function(recvQueueName, amqpApi, clientChannel) {

     return function(prevResult) {
        var promise = new RSVP.Promise(function(resolve, reject) {
            logger.trace("[*** TRANSPORT:CLIENT:INBOUND ***] waiting for muon replies on queue '" + recvQueueName + "'");

            amqpApi.inbound(recvQueueName).listen(function(message) {
                 if ( helper.isHandshakeAccept(message)) {

                    // we're got a handshake confirmation and are now connected to the remote service
                     logger.trace("[*** TRANSPORT:CLIENT:HANDSHAKE ***]  client received negotiation response message %s", JSON.stringify(message));
                     logger.info("[*** TRANSPORT:CLIENT:HANDSHAKE ***] client/server handshake protocol completed successfully");
                     resolve();
                } else {
                     logger.debug("[*** TRANSPORT:CLIENT:INBOUND ***]  client received muon event %s", JSON.stringify(message));
                     var muonMessage = message.data;
                     clientChannel.send(muonMessage);
                }
            });
         });
         return promise;
     }
}


var readyOutboundSocket = function(serviceQueueName, protocol, amqpApi, clientChannel) {

     return function(prevResult) {
         var promise = new RSVP.Promise(function(resolve, reject) {
            clientChannel.listen(function(message){
                messages.validate(message);
                logger.debug("[*** TRANSPORT:CLIENT:OUTBOUND ***] send on queue " + serviceQueueName + "  message=", JSON.stringify(message));
                amqpApi.outbound(serviceQueueName).send({headers: {protocol: protocol, content_type: message.content_type}, data: message});
            });
            //logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] readyOutboundSocket success');
            resolve();
         });
         logger.trace("[*** TRANSPORT:CLIENT:OUTBOUND ***] outbound socket ready on amqp queue  '%s'", serviceQueueName);
         return promise;
      }
}
