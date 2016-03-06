var amqp = require('amqplib/callback_api');
var RSVP = require('rsvp');
require('sexylog');


exports.connect = function(serviceName, serverChannel, url) {
    logger.debug("[*** TRANSPORT:SERVER:MUON-CONNECT ***] " + serviceName + "' connecting to muon");
    amqp.connect(url, function(err, conn) {
      logger.trace("[*** TRANSPORT:SERVER:HANDSHAKE ***] muon server '" + serviceName + "' server listening for negotiation messages on amqp queue %s", serviceName);
      conn.createChannel(function(err, ch) {
        ch.assertQueue(serviceName, {durable: true});
        ch.prefetch(1);
        logger.trace("[*** TRANSPORT:SERVER:HANDSHAKE ***] Server created amqp negotiation queue %s", serviceName);

        ch.consume(serviceName, function(msg) {
           logger.trace("[*** TRANSPORT:SERVER:HANDSHAKE ***]  received negotiation message: %s", msg.content.toString());
           var event = JSON.parse(msg.content);
            event.payload = 'handshake_accepted';
           logger.trace('[*** TRANSPORT:SERVER ***] sending handshake accept response to amqp queue' + event.socket_recv_q);
            ch.sendToQueue(event.socket_recv_q, new Buffer(JSON.stringify(event)), {persistent: true});
            logger.debug("[*** TRANSPORT:SERVER:HANDSAKE ***]  handshake confirmation sent");
            ch.ack(msg);
        }, {noAck: false});
      });
    });


}


function listenForHandshake() {



}