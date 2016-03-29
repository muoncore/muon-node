var uuid = require('node-uuid');
var Joi = require('joi');



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


exports.handshakeRequest = function(protocol, sourceService, listenQueue, replyQueue ) {

  var msg = {
     eventType: "handshakeInitiated",
     PROTOCOL:"request",
     REPLY_TO:replyQueue,
     LISTEN_ON: listenQueue,
     SOURCE_SERVICE: sourceService
    };
   return msg;

}



exports.handshakeAccept = function() {

  var msg = {
        "eventType": "handshakeAccepted",
      "PROTOCOL":"request",
      "REPLY_TO":"--serverside--",
       "LISTEN_ON": "--server-side--",
       "SOURCE_SERVICE": "some-service"
    };
   return msg;

}


exports.message = function(payload, headers) {
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
    validateSchema(message);
    return message;
}


exports.demessage = function(amqpMsg) {
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
        //id: uuid.v4(),
        payload: payload,
        headers: headers
    }
    validateSchema(message);
    return message;
}



/*

var transportHeaders = {
 id: (guid),
 client_send_date: (date),
 muon_receive_date: (date),
 content_type: ’type/subtype’,
 channel_op: ’string’ (optional: normal, close)
 event_type: “handshake/initiated” (required: type/value),
  protocol: ”request” (required),
  server_reply_q: “reply.queue.name" (optional | required if handshake),
  server_listen_q: “listen.queue.name"  (optional | required if handshake),
  origin_service: “client-name"  (required),
  target_service: ”sever-name” (required),
};

*/
var messageSchema = Joi.object().keys({
   id: Joi.string().guid().optional(),
   created: Joi.date().timestamp('javascript').optional(),
   payload: Joi.any().required(),
   headers:  Joi.object().required()
});


exports.validateMessage = function(message) {
    validateSchema(message);
}



function validateSchema(event) {
    var validatedEvent = Joi.validate(event, messageSchema);
    if (validatedEvent.error) {
        logger.info('invalid message: \n', event);
        logger.warn('invalid joi schema for message: ' + JSON.stringify(validatedEvent.error.details));
       throw new Error('Error! problem validating transport message schema: ' + JSON.stringify(validatedEvent.error));
    }
    return event;
}

