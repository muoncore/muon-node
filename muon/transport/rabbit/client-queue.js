var amqp = require('amqplib/callback_api');
var RSVP = require('rsvp');
require('sexylog');

exports.connect = function(serviceName, clientChannel, url) {
    logger.debug("[*** TRANSPORT:CLIENT:MUON-CONNECT ***] client conecting to remote muon service '" + serviceName + "'");
    amqp.connect(url, function(err, amqpConnection) {
        amqpConnection.createChannel(function(err, amqpChannel) {
            var msg = {
                type: 'handshake',
                payload: 'request_handshake',
                source_service: 'client',
                target_service: serviceName,
                socket_recv_q: 'client_temp_recv_q',
                socket_send_q: 'client_temp_send_q'
            };

            createSendQueue(msg.socket_send_q, amqpChannel)
            .then(createRecvQueue(msg.socket_recv_q, amqpChannel))
            .then(listenForHandshakeResponse(msg.socket_recv_q, amqpChannel, clientChannel))
            .then(sendHandshake(serviceName, msg, amqpChannel));

        });
    });

};



var sendHandshake = function(serviceQueueName, msg, amqpChannel) {

     var promise = new RSVP.Promise(function(resolve, reject) {
        amqpChannel.assertQueue(serviceQueueName, {durable: true});
        amqpChannel.sendToQueue(serviceQueueName, new Buffer(JSON.stringify(msg)), {persistent: true});
        logger.debug("[*** TRANSPORT:CLIENT:HANDSHAKE ***] handshake message sent");
        resolve();
     });
     return promise;
}


var listenForHandshakeResponse = function(recvQueueName, amqpChannel, clientChannel) {
    var promise = new RSVP.Promise(function(resolve, reject) {
        logger.trace("[*** TRANSPORT:CLIENT:HANDSHAKE ***] waiting for handshake accept on queue " + recvQueueName);
        amqpChannel.assertQueue(recvQueueName, {durable: false});
        amqpChannel.consume(recvQueueName, function(msg) {
           logger.trace("[*** TRANSPORT:CLIENT:HANDSHAKE ***]  client received negotiation response message %s", msg.content.toString());
            logger.debug("[*** TRANSPORT:CLIENT:HANDSHAKE ***] client/server handshake protocol complete");
            amqpChannel.ack(msg);
            clientChannel.send(msg);
            resolve();
        }, {noAck: false});
     });
     return promise;
}


var createSendQueue = function(sendQueueName, amqpChannel) {
    var promise = new RSVP.Promise(function(resolve, reject) {
            logger.trace('[*** TRANSPORT:CLIENT:MUON-CONNECT ***] creating temp send queue ' + sendQueueName);
            amqpChannel.assertQueue(sendQueueName, {durable: false}, function(err, other) {
                logger.trace('[*** TRANSPORT:CLIENT:MUON-CONNECT ***] queue "' + sendQueueName + '" asserted');
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
          logger.trace('[*** TRANSPORT:CLIENT:MUON-CONNECT ***] create recv queue ' + recvQueueName);
          amqpChannel.assertQueue(recvQueueName, {durable: false}, function(err, other) {
              logger.trace('[*** TRANSPORT:CLIENT:MUON-CONNECT ***] recv queue "' + recvQueueName + '" asserted');
              if (err) {
                  reject();
              } else {
                  resolve();
              }
          });
     });
     return promise;
}




