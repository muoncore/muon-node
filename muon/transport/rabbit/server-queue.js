var amqp = require('amqplib/callback_api');
var RSVP = require('rsvp');
require('sexylog');


exports.connect = function(serviceName, serverChannel, url) {

    amqp.connect(url, function(err, conn) {
      conn.createChannel(function(err, ch) {
        ch.assertQueue(serviceName, {durable: true});
        ch.prefetch(1);
        logger.debug(" [*] Server Waiting for negotiation messages in %s", serviceName);
        ch.consume(serviceName, function(msg) {
           logger.debug(" [*] Server Received Negotiation Message %s", msg.content.toString());
           var event = JSON.parse(msg.content);
            event.payload = 'handshake_accepted';
           logger.debug('server sending handshake accept response to ' + event.socket_recv_q);
            ch.sendToQueue(event.socket_recv_q, new Buffer(JSON.stringify(event)), {persistent: true});
            logger.debug(" [*] Server Handshake Done");
            ch.ack(msg);
        }, {noAck: false});
      });
    });


}