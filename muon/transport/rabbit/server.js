var amqp = require('../../../muon/transport/rabbit/amqp-api.js');
var RSVP = require('rsvp');
var bichannel = require('../../../muon/infrastructure/channel.js');
var helper = require('./transport-helper.js');
require('sexylog');
var messages = require('../../domain/messages.js');


exports.connect = function(serviceName, url, serverStacks, discovery) {


    logger.info("[*** TRANSPORT:SERVER:BOOTSTRAP ***] advertise service on muon discovery '" + serviceName + "'");
    discovery.advertiseLocalService({
        identifier: serviceName,
        tags: ["node", serviceName],
        codecs: ["application/json"],
        connectionUrls:[url]
    });

    logger.debug("[*** TRANSPORT:SERVER:BOOTSTRAP ***] server stack of service '" + serviceName + "' connecting to muon...");
    var serviceQueueName = helper.serviceNegotiationQueueName(serviceName);
    amqp.connect(url).then(function(amqpApi) {
         logger.info("[*** TRANSPORT:SERVER:HANDSHAKE ***] muon service '" + serviceName + "' listening for negotiation messages on amqp queue '%s'", serviceQueueName);
         var amqpQueue = amqpApi.inbound(serviceQueueName);
         amqpQueue.listen(function(msg) {
            logger.debug("[*** TRANSPORT:SERVER:HANDSHAKE ***]  received negotiation message=%s", JSON.stringify(msg));
            messages.validate(msg);
            var serverStackChannel = serverStacks.openChannel(msg.headers.protocol);
            initMuonClientServerSocket(amqpApi, msg.headers.server_listen_q, msg.headers.server_reply_q, serverStackChannel);
            var replyMsg = messages.handshakeAccept();
            amqpApi.outbound(msg.headers.server_reply_q).send(replyMsg);
            logger.info("[*** TRANSPORT:SERVER:HANDSAKE ***]  handshake confirmation sent to queue " +  msg.headers.server_reply_q);
         });
    });
}

function initMuonClientServerSocket(amqpApi, listen_queue, send_queue, serverStackChannel) {

     amqpApi.inbound(listen_queue).listen(function(message) {
            logger.debug("[*** TRANSPORT:SERVER:INBOUND ***]  received inbound message: %s", JSON.stringify(message));
            messages.validate(message);
            serverStackChannel.send(message);
            logger.trace("[*** TRANSPORT:SERVER:INBOUND ***]  inbound muon event sent to server stack channel message.id=%s", message.id);
     });

     serverStackChannel.listen(function(event) {
            logger.debug("[*** TRANSPORT:SERVER:OUTBOUND ***]  handling outbound muon event to queue " + send_queue + ": %s", JSON.stringify(event));
            messages.validate(event);
            amqpApi.outbound(send_queue).send(event);
     });

}