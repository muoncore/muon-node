var amqp = require('amqplib/callback_api');
var RSVP = require('rsvp');
require('sexylog');
var helper = require('./transport-helper.js');
var bichannel = require('../../../muon/infrastructure/channel.js');
var uuid = require('node-uuid');

exports.connect = function(serviceName, url) {

    var clientChannel = bichannel.create(serviceName + "-amqp-transport-client");

    logger.debug("[*** TRANSPORT:CLIENT:HANDSHAKE ***] client connecting to remote muon service '" + serviceName + "'");
    amqp.connect(url, function(err, amqpConnection) {
        amqpConnection.createChannel(function(err, amqpChannel) {

             var handshakeId = uuid.v4();
             var serviceQueueName = helper.serviceNegotiationQueueName(serviceName);
             var sendQueueName = serviceName + ".send." + handshakeId;
             var receiveQueueName = serviceName + ".receive." + handshakeId;
             logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] handshake id=' + handshakeId);
             logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] sendQueueName=' + sendQueueName);
             logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] receiveQueueName=' + receiveQueueName);

            var handshakeMsg = {
                type: 'handshake',
                payload: 'request_handshake',
                source_service: 'client',
                target_service: serviceName,
                socket_recv_q: receiveQueueName,
                socket_send_q: sendQueueName
            };

            createSendQueue(handshakeMsg.socket_send_q, amqpChannel)
            .then(createRecvQueue(handshakeMsg.socket_recv_q, amqpChannel))
            .then(readyInboundSocket(handshakeMsg.socket_recv_q, amqpChannel, clientChannel.rightConnection()))
            .then(sendHandshake(serviceQueueName, handshakeMsg, amqpChannel))
            .then(readyOutboundSocket(handshakeMsg.socket_send_q, amqpChannel, clientChannel.rightConnection()));

        });
    });
    return clientChannel.leftConnection();
};



var sendHandshake = function(serviceQueueName, handshakeMsg, amqpChannel) {

     var promise = new RSVP.Promise(function(resolve, reject) {
        amqpChannel.assertQueue(serviceQueueName, {durable: false});
        amqpChannel.sendToQueue(serviceQueueName, new Buffer(JSON.stringify(handshakeMsg)), {persistent: false});
        logger.debug("[*** TRANSPORT:CLIENT:HANDSHAKE ***] handshake message sent on queue '" + serviceQueueName + "'");
        resolve();
     });
     return promise;
}


var listenForHandshakeResponse = function(recvQueueName, amqpChannel, clientChannel) {
    var promise = new RSVP.Promise(function(resolve, reject) {
        logger.trace("[*** TRANSPORT:CLIENT:HANDSHAKE ***] waiting for handshake accept on queue " + recvQueueName);
        amqpChannel.assertQueue(recvQueueName, {durable: false});
        amqpChannel.consume(recvQueueName, function(handshakeMsg) {
            amqpChannel.ack(handshakeMsg);
            clientChannel.send(handshakeMsg);
            resolve();
        }, {noAck: false});
     });
     return promise;
}

var readyInboundSocket = function(recvQueueName, amqpChannel, clientChannel) {
    var promise = new RSVP.Promise(function(resolve, reject) {
        logger.trace("[*** TRANSPORT:CLIENT:INBOUND ***] waiting for muon replies on queue '" + recvQueueName + "'");
        amqpChannel.assertQueue(recvQueueName, {durable: false});
        amqpChannel.consume(recvQueueName, function(msg) {
            var event = JSON.parse(msg.content.toString());
            if (event.type === 'handshake') {
                 //amqpChannel.ack(msg);
                 logger.trace("[*** TRANSPORT:CLIENT:HANDSHAKE ***]  client received negotiation response message %s", msg.content.toString());
                 logger.debug("[*** TRANSPORT:CLIENT:HANDSHAKE ***] client/server handshake protocol complete");
                resolve();
            } else {
                logger.debug("[*** TRANSPORT:CLIENT:INBOUND ***]  client received muon event %s", JSON.stringify(event));
                clientChannel.send(event);
            }
        }, {noAck: true});
     });
     return promise;
}


var readyOutboundSocket = function(serviceQueueName, amqpChannel, clientChannel) {

     var promise = new RSVP.Promise(function(resolve, reject) {
        amqpChannel.assertQueue(serviceQueueName, {durable: false});
        clientChannel.listen(function(event){
            logger.debug("[*** TRANSPORT:CLIENT:OUTBOUND ***] sending outbound event %s", event);
            amqpChannel.sendToQueue(serviceQueueName, new Buffer(JSON.stringify(event)), {persistent: false});
        });
        resolve();
     });
     logger.debug("[*** TRANSPORT:CLIENT:OUTBOUND ***] outbound socket ready on amqp queue  '%s'", serviceQueueName);
     return promise;
}


var createSendQueue = function(sendQueueName, amqpChannel) {
    var promise = new RSVP.Promise(function(resolve, reject) {
            logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] creating temp send queue "' + sendQueueName + "'");
            amqpChannel.assertQueue(sendQueueName, {durable: false}, function(err, other) {
                logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] queue "' + sendQueueName + '" asserted');
                if (err) {
                    reject();
                } else {
                    resolve();
                }
            });
     });
     return promise;
}


var createRecvQueue = function(recvQueueName, amqpChannel) {
    var promise = new RSVP.Promise(function(resolve, reject) {
          logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] create recv queue "' + recvQueueName + '"');
          amqpChannel.assertQueue(recvQueueName, {durable: false}, function(err, other) {
              logger.trace('[*** TRANSPORT:CLIENT:HANDSHAKE ***] recv queue "' + recvQueueName + '" asserted');
              if (err) {
                  reject();
              } else {
                  resolve();
              }
          });
     });
     return promise;
}




