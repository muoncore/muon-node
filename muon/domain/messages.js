var Joi = require('joi');
var uuid = require('node-uuid');
require('sexylog');
var url = require("url");
var jsonutil = require('jsonutil');
var stackTrace = require('stack-trace');



var schema = Joi.object().keys({
   id: Joi.string().guid().required(),
   created: Joi.date().timestamp('javascript'),
   payload: Joi.any().required(),
   headers:  Joi.object({
       origin_id: Joi.string().guid().optional(),
       event_type: Joi.string().min(3).regex(/(handshake|request|error|exception)\.[a-z]/).required(),
       event_source: Joi.string().min(3).regex(/[a-zA-Z0-9\.-_]/).required(),
       protocol:  Joi.string().min(3).regex(/(request|streaming|event|error)/).required(),
       target_service: Joi.string().min(3).required(),
       origin_service: Joi.string().min(3).required(),
       url: Joi.string().uri().required(),
       channel_op: Joi.string().min(3).regex(/(normal|closed|shutdown)/).required(),
       content_type: Joi.string().min(3).required(),
       content_types: Joi.array().required()
   }).required()
});



exports.validate = function(message) {
    return validateSchema(message);
}



function validateSchema(message) {
    var validatedMessage = Joi.validate(message, schema);
    if (validatedMessage.error) {
        logger.warn('invalid message: \n', message);
        logger.info('invalid joi schema for message! details: ' + JSON.stringify(validatedMessage.error.details));
         logger.error(new Error().stack);
       throw new Error('Error! problem validating rpc message schema: ' + JSON.stringify(validatedMessage.error));
    }
    return message;
}

exports.createMessage = function(payload, headers, source) {
        return createMessage(payload, headers, source);
}

exports.copy = function(json) {
    return jsonutil.deepCopy(json);
}



exports.rpcMessage = function(payload, sourceService, remoteServiceUrl) {

   logger.trace("messages.rpcMessage(payload='" +  payload + "', sourceService='" +  sourceService + "', remoteServiceUrl='" +  remoteServiceUrl + "')");

    var messageid = uuid.v4();

    var serviceRequest = url.parse(remoteServiceUrl, true);
    //logger.trace('********************************* arguments.callee.caller=' + callingObject());

    var headers = {
          event_type: "request.made",
          protocol: "request",
          event_source: callingObject(),
          event_subtype: 'ok',
          target_service: serviceRequest.hostname,
          origin_service: sourceService,
          url: remoteServiceUrl
    };

   var message = createMessage(payload, headers);
   return validateSchema(message);

};











function createMessage(payload, headers, source) {
    logger.trace('createMessage(payload='  + JSON.stringify(payload) + ', headers='  + JSON.stringify(headers) +  ')');
    if (! payload) payload = {};
    if (! headers.channel_op) headers.channel_op = 'normal';
    if (! headers.content_type) headers.content_type = 'application/json';
    if (! headers.content_types) headers.content_types = ['application/json'];
    if (! headers.origin_id) headers.origin_id = uuid.v4();
    if (source) headers.event_source = source;
    if (! headers.event_source) headers.event_source = callingObject();
    if (! headers.url) headers.url = 'muon://n/a';
    if (! headers.channel_op) headers.channel_op = 'normal';

     var message = {
         id: uuid.v4(),
         created: new Date(),
         payload: payload,
         headers: {
              origin_id: headers.origin_id,
              event_type: headers.event_type,
              protocol: headers.protocol,
              target_service: headers.target_service,
              origin_service: headers.origin_service,
              event_source: headers.event_source,
              url: headers.url,
              channel_op: headers.channel_op,
              content_type: headers.content_type,
              content_types: headers.content_types
         },
     };
     logger.trace('createMessage() return message='  + JSON.stringify(message));
    return message;
}


function callingObject() {

    var err = new Error('something went wrong');
    var trace = stackTrace.parse(err);
    var stackCounter = 1;
     // <-- TODO to get correct file name you may need to tweak the call stack index

    var inThisObject = true;
    var object = 'messages.js';
    while(inThisObject) {
        var call = trace[stackCounter];
        var file = call.getFileName();
        var pathElements = file.split('/');
        var object = pathElements[pathElements.length - 1];
        //logger.trace('in stacktrace: object=' + object);
        if (object === 'messages.js') {
            stackCounter++;
        } else {
            inThisObject = false;
        }
        object = object + ':' + call.getLineNumber();
    }
	return object;
}