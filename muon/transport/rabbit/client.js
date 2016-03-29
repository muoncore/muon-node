var amqp = require('../../../muon/transport/rabbit/amqp-api.js');
var RSVP = require('rsvp');
require('sexylog');
var helper = require('./transport-helper.js');
var bichannel = require('../../../muon/infrastructure/channel.js');
var uuid = require('node-uuid');
var messages = require('../../domain/messages.js');

exports.connect = function(serviceName, url) {

    var clientChannel = bichannel.create(serviceName + "-amqp-transport-client");

    amqp.connect(url).then(function(api) {
        logger.debug('[*** TRANSPORT:CLIENT:BOOTSTRAP ***] connected to amqp-api');
        var handshakeId = uuid.v4();
        var serviceQueueName = helper.serviceNegotiationQueueName(serviceName);
        var serverListenQueueName = serviceName + ".listen." + handshakeId;
        var replyQueueName = serviceName + ".reply." + handshakeId;
        var handshakeMsg = messages.handshakeRequest('request', serviceName, serverListenQueueName, replyQueueName);

         RSVP.resolve()
        .then(sendHandshake(serviceQueueName, handshakeMsg, api))
        .then(readyInboundSocket(replyQueueName, api, clientChannel.rightConnection()))
        .then(readyOutboundSocket(serverListenQueueName, api, clientChannel.rightConnection()));
     });

    return clientChannel.leftConnection();
};





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
                 if ( message.headers.event_type === 'handshakeAccepted') {
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




