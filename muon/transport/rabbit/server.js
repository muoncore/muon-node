var amqp = require('amqplib/callback_api');
var RSVP = require('rsvp');
var bichannel = require('../../../muon/infrastructure/channel.js');
var helper = require('./transport-helper.js');
require('sexylog');


exports.connect = function(serviceName, serverStackChannel, url) {

    logger.debug("[*** TRANSPORT:SERVER:BOOTSTRAP ***] servers-ide of service '" + serviceName + "' connecting to muon...");
      var serviceQueueName = helper.serviceNegotiationQueueName(serviceName);
    amqp.connect(url, function(err, conn) {
      logger.trace("[*** TRANSPORT:SERVER:HANDSHAKE ***] muon service '" + serviceName + "' listening for negotiation messages on amqp queue '%s'", serviceQueueName);
      conn.createChannel(function(err, ch) {

        ch.assertQueue(serviceQueueName, helper.queueSettings());
        ch.prefetch(1);
        logger.trace("[*** TRANSPORT:SERVER:HANDSHAKE ***] Server created amqp negotiation queue '%s'", serviceQueueName);

        ch.consume(serviceQueueName, function(msg) {

            var prettyMsg = {
                properties: JSON.stringify(msg.properties),
                fields: msg.fields,
                content: msg.content.toString(),
            }
            logger.warn('[*** TRANSPORT:SERVER:HANDSHAKE ***] raw incoming message: ');
            console.dir(prettyMsg);
           logger.trace("[*** TRANSPORT:SERVER:HANDSHAKE ***]  received negotiation message. content=%s", msg.content.toString());
           var headers = msg.properties.headers;
            logger.trace("[*** TRANSPORT:SERVER:HANDSHAKE ***]  negotiation headers=%s", JSON.stringify(headers));
           logger.trace('[*** TRANSPORT:SERVER ***] sending handshake accept response to amqp queue ' + headers.REPLY_TO);
            initMuonClientServerSocket(conn, headers.LISTEN_ON, headers.REPLY_TO, serverStackChannel);
            ch.sendToQueue(headers.REPLY_TO, new Buffer(''), {persistent: false, headers: helper.handshakeAccept()});
            logger.debug("[*** TRANSPORT:SERVER:HANDSAKE ***]  handshake confirmation sent to queue ");
            ch.ack(msg);
        }, {noAck: false});
      });
    });
}

function initMuonClientServerSocket(amqpConnection, listen_queue, send_queue, serverStackChannel) {

    amqpConnection.createChannel(function(err, ch) {

        ch.assertQueue(listen_queue, helper.queueSettings());
        ch.prefetch(1); // todo do we need this?
        ch.consume(listen_queue, function(msg){
            logger.debug("[*** TRANSPORT:SERVER:INBOUND ***]  received inbound muon event: %s", msg.content.toString());
            var event = JSON.parse(msg.content.toString());
            serverStackChannel.send(event);
            ch.ack(msg);
            logger.trace("[*** TRANSPORT:SERVER:INBOUND ***]  inbound muon event sent to server stack channel %s", event.id);
        }, {noAck: false});

        serverStackChannel.listen(function(event) {
            logger.debug("[*** TRANSPORT:SERVER:OUTBOUND ***]  handling outbound muon event: %s", JSON.stringify(event));
            ch.sendToQueue(send_queue, new Buffer(JSON.stringify(event)), {persistent: false, headers: event.headers});
        });
    });
}


