var amqp = require('amqplib/callback_api');
var RSVP = require('rsvp');
require('sexylog');

exports.connect = function(serviceName, clientChannel, url) {

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
        logger.info(" [*] Client Sent handshake message");
        resolve();
     });
     return promise;
}


var listenForHandshakeResponse = function(recvQueueName, amqpChannel, clientChannel) {
    var promise = new RSVP.Promise(function(resolve, reject) {
        logger.info(" [*] Client listen on " + recvQueueName);
        amqpChannel.assertQueue(recvQueueName, {durable: false});
        amqpChannel.consume(recvQueueName, function(msg) {
           logger.info(" [*] Cleint Received Negotiation Response Message %s", msg.content.toString());
            logger.info(" [*] Cleint/Server Handshake Done");
            amqpChannel.ack(msg);
            clientChannel.send(msg);
            resolve();
        }, {noAck: false});
     });
     return promise;
}


var createSendQueue = function(sendQueueName, amqpChannel) {
    var promise = new RSVP.Promise(function(resolve, reject) {
            logger.info('createSendQueue ' + sendQueueName);
            amqpChannel.assertQueue(sendQueueName, {durable: false}, function(err, other) {
                logger.info('createSendQueue ' + sendQueueName + ' asserted');
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
          logger.info('createRecvQueue ' + recvQueueName);
          amqpChannel.assertQueue(recvQueueName, {durable: false}, function(err, other) {
              logger.info('createRecvQueue ' + recvQueueName + ' asserted');
              if (err) {
                  reject();
              } else {
                  resolve();
              }
          });
     });
     return promise;
}




