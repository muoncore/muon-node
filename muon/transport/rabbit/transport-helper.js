var uuid = require('node-uuid');
var Joi = require('joi');
require('sexylog');

// Regular expressions for transport message format:
var reply_queue_regex = /[a-z0-9\-]\.reply\.[a-zA-Z0-9\-]/;
var listen_queue_regex = /[a-z0-9\-]\.listen\.[a-zA-Z0-9\-]/;
var protocol_regex = /^(rpc|request|streaming|event|cqrs)$/;

var transportMessageSchema = Joi.object().keys({
   data: Joi.any().required(),
   properties: Joi.object().optional(),
   headers:  Joi.object({
       handshake: Joi.string().min(3).regex(/(initiated|accepted)/).optional(),
       protocol: Joi.alternatives().when('handshake', { is: 'initiated', then: Joi.string().regex(protocol_regex).required(), otherwise: Joi.string().regex(protocol_regex).optional() }),
       server_reply_q: Joi.alternatives().when('handshake', { is: 'initiated', then: Joi.string().regex(reply_queue_regex).required(), otherwise: Joi.forbidden() }),
       server_listen_q: Joi.alternatives().when('handshake', { is: 'initiated', then: Joi.string().regex(listen_queue_regex).required(), otherwise: Joi.forbidden() }),
       content_type: Joi.string().min(10).regex(/[a-z\.]\/[a-z\.]/).optional(),
   }).required()
});

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
     handshake: "initiated",
     protocol: protocol,
     server_reply_q: replyQueue,
     server_listen_q: listenQueue,
    };
   return headers;

}

exports.isHandshakeAccept = function(msg) {
    return (msg.headers.handshake === 'accepted' || msg.headers.handshake === 'initiated');
}

exports.handshakeAcceptHeaders = function() {

  var headers = {
     handshake: "accepted",
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
        data: payload,
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
            data: contents
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


exports.validateMessage = function(msg) {
    return validate(msg);
}


function validate(message) {

     var validatedMessage = Joi.validate(message, transportMessageSchema);
        if (validatedMessage.error) {
            logger.warn('invalid transport message: "' + JSON.stringify(message) + '"');
            logger.info('invalid joi schema for transport message! details: ' + JSON.stringify(validatedMessage.error.details));
             logger.error(new Error().stack);
           throw new Error('Error! problem validating transport message schema: ' + JSON.stringify(validatedMessage.error));
        }
        return message;

}