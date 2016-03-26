var amqp = require('../../../muon/transport/rabbit/amqp-api.js');
var RSVP = require('rsvp');
var bichannel = require('../../../muon/infrastructure/channel.js');
var helper = require('./transport-helper.js');
require('sexylog');


exports.connect = function(serviceName, serverStackChannel, url) {
    logger.debug("[*** TRANSPORT:SERVER:BOOTSTRAP ***] server stack of service '" + serviceName + "' connecting to muon...");
    var serviceQueueName = helper.serviceNegotiationQueueName(serviceName);
    amqp.connect(url).then(function(amqpApi) {
        logger.debug("[*** TRANSPORT:SERVER:BOOTSTRAP ***] server stack of service '" + serviceName + "' listening on queue '" + serviceQueueName + "'");
         amqpApi.inbound(serviceQueueName).listen(function(msg) {
            logger.trace("[*** TRANSPORT:SERVER:HANDSHAKE ***] muon service '" + serviceName + "' listening for negotiation messages on amqp queue '%s'", serviceQueueName);
            logger.trace("[*** TRANSPORT:SERVER:HANDSHAKE ***]  received negotiation message. content=%s", JSON.stringify(msg.payload));
            logger.trace("[*** TRANSPORT:SERVER:HANDSHAKE ***]  negotiation headers=%s", JSON.stringify(msg.headers));
            logger.trace('[*** TRANSPORT:SERVER ***] sending handshake accept response to amqp queue ' + msg.headers.REPLY_TO);
            initMuonClientServerSocket(amqpApi, msg.headers.LISTEN_ON, msg.headers.REPLY_TO, serverStackChannel);
            amqpApi.outbound(msg.headers.REPLY_TO).send({headers: helper.handshakeAccept(), payload: {}});
            logger.debug("[*** TRANSPORT:SERVER:HANDSAKE ***]  handshake confirmation sent to queue ");
         });
    });
}

function initMuonClientServerSocket(amqpApi, listen_queue, send_queue, serverStackChannel) {

     amqpApi.inbound(listen_queue).listen(function(msg) {
            logger.debug("[*** TRANSPORT:SERVER:INBOUND ***]  received inbound muon event: %s", JSON.stringify(msg));
            var event = msg;
            serverStackChannel.send(event);
            logger.trace("[*** TRANSPORT:SERVER:INBOUND ***]  inbound muon event sent to server stack channel %s", event.id);
     });

     serverStackChannel.listen(function(event) {
            logger.debug("[*** TRANSPORT:SERVER:OUTBOUND ***]  handling outbound muon event: %s", JSON.stringify(event));
             //var msg = new Buffer(JSON.stringify(event));
             amqpApi.outbound(send_queue).send(event);
     });

}