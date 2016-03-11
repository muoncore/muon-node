var amqp = require('amqplib/callback_api');
var RSVP = require('rsvp');
require('sexylog');
var helper = require('./transport-helper.js');
var bichannel = require('../../../muon/infrastructure/channel.js');
var uuid = require('node-uuid');
var async = require('async');



exports.connect = function(serviceName, url) {

    var clientChannel = bichannel.create(serviceName + "-amqp-transport-client");

    logger.debug("[*** TRANSPORT:CLIENT:HANDSHAKE ***] client connecting to remote muon service '" + serviceName + "'");
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

            async.series([
                createSendQueue(serverListenQueueName, amqpChannel),
                createRecvQueue(replyQueueName, amqpChannel),
                readyInboundSocket(replyQueueName, amqpChannel, clientChannel.rightConnection()),
                sendHandshake(serviceQueueName, handshakeMsg, amqpChannel),
                listenForHandshakeResponse(replyQueueName, amqpChannel),
                readyOutboundSocket(serverListenQueueName, amqpChannel, clientChannel.rightConnection())
            ]);

        });
    });
    return clientChannel.leftConnection();
};



var sendHandshake = function(serviceQueueName, handshakeMsg, amqpChannel) {

     var promise = new RSVP.Promise(function(resolve, reject) {

        amqpChannel.assertQueue(serviceQueueName, helper.queueSettings());
        amqpChannel.sendToQueue(serviceQueueName, new Buffer(JSON.stringify(handshakeMsg)), {persistent: false, headers: handshakeMsg});
        logger.debug("[*** TRANSPORT:CLIENT:HANDSHAKE ***] handshake message sent on queue '" + serviceQueueName + "'");
        logger.error('sendHandshake resolve()');
        resolve('4');
     });
     return promise;
}


var listenForHandshakeResponse = function(recvQueueName, amqpChannel) {
    var promise = new RSVP.Promise(function(resolve, reject) {
        logger.trace("[*** TRANSPORT:CLIENT:HANDSHAKE ***] waiting for handshake accept on queue " + recvQueueName);
        //amqpChannel.assertQueue(recvQueueName, helper.queueSettings());
        amqpChannel.consume(recvQueueName, function(handshakeMsg) {
             console.dir(msg);
             logger.trace("[*** TRANSPORT:CLIENT:HANDSHAKE ***]  client received negotiation response message %s", msg.content.toString());
             logger.debug("[*** TRANSPORT:CLIENT:HANDSHAKE ***] client/server handshake protocol complete");
            amqpChannel.ack(handshakeMsg);
            //amqpChannel.close();
            logger.error('listenForHandshakeResponse resolve()');
            resolve('5');
        }, {noAck: false});
     });
     return promise;
}

var readyInboundSocket = function(recvQueueName, amqpChannel, clientChannel) {
    var promise = new RSVP.Promise(function(resolve, reject) {
        logger.trace("[*** TRANSPORT:CLIENT:INBOUND ***] waiting for muon replies on queue '" + recvQueueName + "'");
        amqpChannel.assertQueue(recvQueueName, helper.queueSettings());
        amqpChannel.consume(recvQueueName, function(msg) {
            var event = JSON.parse(msg.content.toString());
            logger.debug("[*** TRANSPORT:CLIENT:INBOUND ***]  client received muon event %s", JSON.stringify(event));
            clientChannel.send(event);
        }, {noAck: true});
        logger.error('readyInboundSocket resolve()');
        resolve('3');
     });

     return promise;
}


var readyOutboundSocket = function(serviceQueueName, amqpChannel, clientChannel) {

     var promise = new RSVP.Promise(function(resolve, reject) {
        amqpChannel.assertQueue(serviceQueueName, helper.queueSettings());
        clientChannel.listen(function(event){
            logger.debug("[*** TRANSPORT:CLIENT:OUTBOUND ***] sending outbound event %s", JSON.stringify(event));
            amqpChannel.sendToQueue(serviceQueueName, new Buffer(JSON.stringify(event)), {persistent: false});
        });
        logger.error('readyOutboundSocket resolve()');
        resolve('6');
     });
     logger.debug("[*** TRANSPORT:CLIENT:OUTBOUND ***] outbound socket ready on amqp queue  '%s'", serviceQueueName);
     return promise;
}


var createSendQueue = function(sendQueueName, amqpChannel) {
    var promise = new RSVP.Promise(function(resolve, reject) {
            logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] creating temp send queue "' + sendQueueName + "'");
            amqpChannel.assertQueue(sendQueueName, helper.queueSettings(), function(err, other) {
                logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] queue "' + sendQueueName + '" asserted');
                if (err) {
                    reject();
                } else {
                    logger.error('createSendQueue resolve()');
                    resolve('1');
                }
            });
     });
     return promise;
}


var createRecvQueue = function(recvQueueName, amqpChannel) {
    var promise = new RSVP.Promise(function(resolve, reject) {
          logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] create recv queue "' + recvQueueName + '"');
          amqpChannel.assertQueue(recvQueueName, helper.queueSettings(), function(err, other) {
              logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] recv queue "' + recvQueueName + '" asserted');
              if (err) {
                  reject();
              } else {
                    logger.error('createRecvQueue resolve()');
                  resolve('2');
              }
          });
     });
     return promise;
}




