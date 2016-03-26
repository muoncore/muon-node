var amqp = require('../../../muon/transport/rabbit/amqp-api.js');
var RSVP = require('rsvp');
var bichannel = require('../../../muon/infrastructure/channel.js');
var helper = require('./transport-helper.js');
require('sexylog');
var events = require('../../domain/events.js');


exports.connect = function(serviceName, serverStackChannel, url) {
    logger.debug("[*** TRANSPORT:SERVER:BOOTSTRAP ***] server stack of service '" + serviceName + "' connecting to muon...");
    var serviceQueueName = helper.serviceNegotiationQueueName(serviceName);
    amqp.connect(url).then(function(amqpApi) {
         logger.trace("[*** TRANSPORT:SERVER:HANDSHAKE ***] muon service '" + serviceName + "' listening for negotiation messages on amqp queue '%s'", serviceQueueName);
         var amqpQueue = amqpApi.inbound(serviceQueueName);
         amqpQueue.listen(function(msg) {
            logger.trace("[*** TRANSPORT:SERVER:HANDSHAKE ***]  received negotiation message=%s", JSON.stringify(msg));
            initMuonClientServerSocket(amqpApi, msg.headers.LISTEN_ON, msg.headers.REPLY_TO, serverStackChannel);
            amqpApi.outbound(msg.headers.REPLY_TO).send({headers: helper.handshakeAccept(), payload: {}});
            logger.debug("[*** TRANSPORT:SERVER:HANDSAKE ***]  handshake confirmation sent to queue " +  msg.headers.REPLY_TO);
         });
    });
}

function initMuonClientServerSocket(amqpApi, listen_queue, send_queue, serverStackChannel) {

     amqpApi.inbound(listen_queue).listen(function(event) {
            logger.debug("[*** TRANSPORT:SERVER:INBOUND ***]  received inbound muon event: %s", JSON.stringify(event));
            events.validate(event);
            serverStackChannel.send(event);
            logger.trace("[*** TRANSPORT:SERVER:INBOUND ***]  inbound muon event sent to server stack channel %s", event.id);
     });

     serverStackChannel.listen(function(event) {
            logger.debug("[*** TRANSPORT:SERVER:OUTBOUND ***]  handling outbound muon event: %s", JSON.stringify(event));
            events.validate(event);
            amqpApi.outbound(send_queue).send(event);
     });

}