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
      "REPLY_TO":"stream-reply",
       "LISTEN_ON": "stream-listen",
       "SOURCE_SERVICE": "some-service"
    };
   return msg;

}


exports.message = function(payload, headers) {

    var message = {
        payload: payload,
        headers: headers
    }
    validateSchema(message);
    return message;
}


var messageSchema = Joi.object().keys({
   payload: Joi.object().required(),
   headers:  Joi.object().required()
});


exports.validateMessage = function(message) {
    validateSchema(message);
}



function validateSchema(event) {
    var validatedEvent = Joi.validate(event, schema);
    if (validatedEvent.error) {
        logger.warn('invalid message: \n', event);
        logger.info('invalid joi schema for message: ' + JSON.stringify(validatedEvent.error.details));
       throw new Error('Error! problem validating transport message schema: ' + JSON.stringify(validatedEvent.error));
    }
    return event;
}

