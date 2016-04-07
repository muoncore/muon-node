var uuid = require('node-uuid');
var Joi = require('joi');
require('sexylog');



exports.serviceNegotiationQueueName = function(serviceName) {

    var serviceQueueName = "service." + serviceName;
    return serviceQueueName;
}


exports.queueSettings = function() {
    var queueSettings = {
         durable: false,
         type: "direct",
         autoDelete: true,
         confirm: true
       };

       return queueSettings;
}


exports.handshakeRequestHeaders = function(protocol, listenQueue, replyQueue) {

  var headers = {
     message_type: "handshake.initiated",
     protocol: protocol,
     server_reply_q: replyQueue,
     server_listen_q: listenQueue,
    };
   return headers;

}

exports.isHandshakeAccept = function(msg) {
    return (msg.headers.message_type === 'handshake.accepted');
}

exports.handshakeAcceptHeaders = function() {

  var headers = {
     message_type: "handshake.accepted"
    };
   return headers;

}


exports.toWire = function(payload, headers) {
     logger.trace('message(payload='  + JSON.stringify(payload) + ', headers='  + JSON.stringify(headers) +  ')');
    if (! headers) headers = {};
    var payloadString = '-***###-payload-string-undefined-###***-';
    if (typeof payload == 'object') {
       payloadString = JSON.stringify(payload);
    } else {
        payloadString = payload.toString();
    }
    var contents = new Buffer(payloadString);
    var message = {
        payload: contents,
        headers: headers
    }
    return message;
}


exports.fromWireOld = function(amqpMsg) {
    logger.trace('demessage(amqpMsg='  + JSON.stringify(amqpMsg) + ')');
    var headers = amqpMsg.properties.headers;
    var payload = JSON.parse(amqpMsg.content).data;
    if (! headers) headers = {};
    if (headers['Content-type'] == 'application/json') {
        payload = JSON.parse(new Buffer(payload).toString());
    } else {
        payload = new Buffer(payload).toString();
    }
    logger.trace('demessage(payload='  + JSON.stringify(payload) + ', headers='  + JSON.stringify(headers) +  ')');
    var message = {
        payload: payload,
        headers: headers
    }
    return message;
}



exports.fromWire = function(msg) {
    try {
        logger.trace('messages.fromWire('  + JSON.stringify(msg) + ')');
        //console.dir(msg);
        var headers = msg.properties.headers;
        var contents = msg.content.toString();
        logger.trace("messages.fromWire() contents: '" + contents + "'");
        try {
            contents = JSON.parse(contents);
        } catch (err) {
            // do nothing, it's not an json object so can't be parsed
        }
        var message = {
            headers: headers,
            payload: contents
        };
        logger.trace('messages.fromWire() return message='  + JSON.stringify(message) );
       return message;
   } catch (err) {
        logger.error('error converting amqp wire format message to muon event message');
        logger.error(err);
        logger.error(err.stack);
        throw new Error(err);
   }
}


