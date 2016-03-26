var amqp = require('../../../muon/transport/rabbit/amqp-api.js');
var RSVP = require('rsvp');
require('sexylog');
var helper = require('./transport-helper.js');
var bichannel = require('../../../muon/infrastructure/channel.js');
var uuid = require('node-uuid');
var events = require('../../domain/events.js');

exports.connect = function(serviceName, url) {

    var clientChannel = bichannel.create(serviceName + "-amqp-transport-client");

    amqp.connect(url).then(function(api) {
        logger.debug('[*** TRANSPORT:CLIENT:BOOTSTRAP ***] connected to amqp-api');
        var handshakeId = uuid.v4();
        var serviceQueueName = helper.serviceNegotiationQueueName(serviceName);
        var serverListenQueueName = serviceName + ".listen." + handshakeId;
        var replyQueueName = serviceName + ".reply." + handshakeId;
        var handshakeMsg = helper.handshakeRequest('request', serviceName, serverListenQueueName, replyQueueName);

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
        var msg = {
            headers: handshakeMsg,
            payload: {}
        }
        var channel = amqpApi.outbound(serviceQueueName).send(msg);
        logger.trace("[*** TRANSPORT:CLIENT:HANDSHAKE ***] handshake message sent on queue '" + serviceQueueName + "'");
        resolve();
     });
     return promise;
  }
}


var readyInboundSocket = function(recvQueueName, amqpApi, clientChannel) {

     return function(prevResult) {
        var promise = new RSVP.Promise(function(resolve, reject) {
            logger.debug("[*** TRANSPORT:CLIENT:INBOUND ***] waiting for muon replies on queue '" + recvQueueName + "'");

            amqpApi.inbound(recvQueueName).listen(function(msg) {
                 //todo validate event/msg format here
                 if ( msg.headers.eventType === 'handshakeAccepted') {
                    // we're got a handshake confirmation and are now connected to the remote service
                     logger.trace("[*** TRANSPORT:CLIENT:HANDSHAKE ***]  client received negotiation response message %s", msg);
                     logger.info("[*** TRANSPORT:CLIENT:HANDSHAKE ***] client/server handshake protocol completed successfully");
                     resolve();
                } else {
                     var event = msg;
                     if (! event.id) event.id = uuid.v4();
                     logger.debug("[*** TRANSPORT:CLIENT:INBOUND ***]  client received muon event %s", JSON.stringify(event));
                     events.validate(event);
                     clientChannel.send(event);
                }
            });
         });
         return promise;
     }
}


var readyOutboundSocket = function(serviceQueueName, amqpApi, clientChannel) {

     return function(prevResult) {
         var promise = new RSVP.Promise(function(resolve, reject) {
            clientChannel.listen(function(event){
                events.validate(event);
                logger.debug("[*** TRANSPORT:CLIENT:OUTBOUND ***] send on queue " + serviceQueueName + "  event", JSON.stringify(event));
                amqpApi.outbound(serviceQueueName).send(event);
            });
            logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] readyOutboundSocket success');
            resolve();
         });
         logger.debug("[*** TRANSPORT:CLIENT:OUTBOUND ***] outbound socket ready on amqp queue  '%s'", serviceQueueName);
         return promise;
      }
}




