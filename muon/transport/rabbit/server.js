var amqp = require('amqplib/callback_api');
var RSVP = require('rsvp');
var bichannel = require('../../../muon/infrastructure/channel.js');
require('sexylog');


exports.connect = function(serviceName, serverStackChannel, url) {

    logger.debug("[*** TRANSPORT:SERVER:MUON-CONNECT ***] " + serviceName + "' connecting to muon");
    amqp.connect(url, function(err, conn) {
      logger.trace("[*** TRANSPORT:SERVER:HANDSHAKE ***] muon service '" + serviceName + "' listening for negotiation messages on amqp queue '%s'", serviceName);
      conn.createChannel(function(err, ch) {
        ch.assertQueue(serviceName, {durable: false});
        ch.prefetch(1);
        logger.trace("[*** TRANSPORT:SERVER:HANDSHAKE ***] Server created amqp negotiation queue '%s'", serviceName);

        ch.consume(serviceName, function(msg) {
           logger.trace("[*** TRANSPORT:SERVER:HANDSHAKE ***]  received negotiation message: %s", msg.content.toString());
           var event = JSON.parse(msg.content);
            event.payload = 'handshake_accepted';
           logger.trace('[*** TRANSPORT:SERVER ***] sending handshake accept response to amqp queue' + event.socket_recv_q);
            initMuonClientServerSocket(conn, event.socket_send_q, event.socket_recv_q, serverStackChannel);
            ch.sendToQueue(event.socket_recv_q, new Buffer(JSON.stringify(event)), {persistent: false});
            logger.debug("[*** TRANSPORT:SERVER:HANDSAKE ***]  handshake confirmation sent");
            ch.ack(msg);
        }, {noAck: false});
      });
    });
}

function initMuonClientServerSocket(amqpConnection, listen_queue, send_queue, serverStackChannel) {

    amqpConnection.createChannel(function(err, ch) {

        ch.assertQueue(listen_queue, {durable: false});
        ch.prefetch(1); // todo do we need this?
        ch.consume(listen_queue, function(msg){
            logger.debug("[*** TRANSPORT:SERVER:INBOUND ***]  received inbound muon event: %s", msg.content.toString());
            var event = JSON.parse(msg.content.toString());
            serverStackChannel.send(event);
            ch.ack(msg);
            //logger.trace("[*** TRANSPORT:SERVER:INBOUND ***]  inbound muon event sent to server stack channel %s", event.content.id);
        }, {noAck: false});

        serverStackChannel.listen(function(event) {
            logger.debug("[*** TRANSPORT:SERVER:OUTBOUND ***]  handling outbound muon event: %s", JSON.stringify(event));
            ch.sendToQueue(send_queue, new Buffer(JSON.stringify(event)), {persistent: false});
        });
    });
}


