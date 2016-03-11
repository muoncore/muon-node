var amqp = require('amqplib/callback_api');
var RSVP = require('rsvp');
require('sexylog');
var helper = require('./transport-helper.js');
var bichannel = require('../../../muon/infrastructure/channel.js');
var uuid = require('node-uuid');
var async = require('async');



exports.connect = function(serviceName, url) {

    var clientChannel = bichannel.create(serviceName + "-amqp-transport-client");

    logger.info("[*** TRANSPORT:CLIENT:HANDSHAKE ***] muon client connecting to remote muon service '" + serviceName + "'");
    amqp.connect(url, function(err, amqpConnection) {
        amqpConnection.createChannel(function(err, amqpChannel) {

             var handshakeId = uuid.v4();
             var serviceQueueName = helper.serviceNegotiationQueueName(serviceName);
             var serverListenQueueName = serviceName + ".listen." + handshakeId;
             var replyQueueName = serviceName + ".reply." + handshakeId;
              var handshakeMsg = helper.handshakeRequest('request', serviceName, serverListenQueueName, replyQueueName);
             logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] handshake id=' + handshakeId);
             logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] handshake msg=' + JSON.stringify(handshakeMsg));
             logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] serverListenQueueName=' + serverListenQueueName);
             logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] replyQueueName=' + replyQueueName);

            RSVP.resolve()
            .then(createSendQueue(serverListenQueueName, amqpChannel))
            .then(createRecvQueue(replyQueueName, amqpChannel))
            .then(sendHandshake(serviceQueueName, handshakeMsg, amqpChannel))
            .then(readyInboundSocket(replyQueueName, amqpChannel, clientChannel.rightConnection()))
            .then(readyOutboundSocket(serverListenQueueName, amqpChannel, clientChannel.rightConnection()));

        });
    });
    return clientChannel.leftConnection();
};



var sendHandshake = function(serviceQueueName, handshakeMsg, amqpChannel) {

  return function(prevResult) {

     var promise = new RSVP.Promise(function(resolve, reject) {

        amqpChannel.assertQueue(serviceQueueName, helper.queueSettings());
        amqpChannel.sendToQueue(serviceQueueName, new Buffer(''), {persistent: false, headers: handshakeMsg});
        logger.trace("[*** TRANSPORT:CLIENT:HANDSHAKE ***] handshake message sent on queue '" + serviceQueueName + "'");
        resolve('4');
     });
     return promise;
  }
}


var readyInboundSocket = function(recvQueueName, amqpChannel, clientChannel) {

 return function(prevResult) {
    var promise = new RSVP.Promise(function(resolve, reject) {
        logger.debug("[*** TRANSPORT:CLIENT:INBOUND ***] waiting for muon replies on queue '" + recvQueueName + "'");
        amqpChannel.assertQueue(recvQueueName, helper.queueSettings());
        amqpChannel.consume(recvQueueName, function(msg) {

            if (msg.content.toString() === '' || msg.properties.headers.eventType === 'handshakeAccepted') {
                // we're got a handshake confirmation and are now connected to the remote service
                 logger.trace("[*** TRANSPORT:CLIENT:HANDSHAKE ***]  client received negotiation response message %s", msg.content.toString());
                 logger.info("[*** TRANSPORT:CLIENT:HANDSHAKE ***] client/server handshake protocol completed successfully");
                 resolve();
            } else {
                 var event = JSON.parse(msg.content.toString());
                 if (! event.id) event.id = uuid.v4();
                logger.debug("[*** TRANSPORT:CLIENT:INBOUND ***]  client received muon event %s", JSON.stringify(event));
                clientChannel.send(event);
            }
            amqpChannel.ack(msg);
        }, {noAck: false});
     });

     return promise;
  }
}


var readyOutboundSocket = function(serviceQueueName, amqpChannel, clientChannel) {

 return function(prevResult) {
     var promise = new RSVP.Promise(function(resolve, reject) {
        amqpChannel.assertQueue(serviceQueueName, helper.queueSettings());
        clientChannel.listen(function(event){
            logger.debug("[*** TRANSPORT:CLIENT:OUTBOUND ***] sending outbound event", JSON.stringify(event));
            amqpChannel.sendToQueue(serviceQueueName, new Buffer(JSON.stringify(event)), {persistent: false, headers: event.headers});
        });
        logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] readyOutboundSocket success');
        resolve();
     });
     logger.debug("[*** TRANSPORT:CLIENT:OUTBOUND ***] outbound socket ready on amqp queue  '%s'", serviceQueueName);
     return promise;
  }
}


var createSendQueue = function(sendQueueName, amqpChannel) {

 return function(prevResult) {
    var promise = new RSVP.Promise(function(resolve, reject) {
            logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] creating temp send queue "' + sendQueueName + "'");
            amqpChannel.assertQueue(sendQueueName, helper.queueSettings(), function(err, other) {
                logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] queue "' + sendQueueName + '" asserted');
                if (err) {
                    reject();
                } else {
                    logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] created send queue success');
                    resolve('1');
                }
            });
     });
     return promise;
  }
}


var createRecvQueue = function(recvQueueName, amqpChannel) {

 return function(prevResult) {
    var promise = new RSVP.Promise(function(resolve, reject) {
          logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] create recv queue "' + recvQueueName + '"');
          amqpChannel.assertQueue(recvQueueName, helper.queueSettings(), function(err, other) {
              logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] recv queue "' + recvQueueName + '" asserted');
              if (err) {
                  reject();
              } else {
                  logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] created recv queue success');
                  resolve();
              }
          });
     });
     return promise;
  }
}




