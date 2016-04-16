var Joi = require('joi');
var uuid = require('node-uuid');
require('sexylog');
var url = require("url");
var jsonutil = require('jsonutil');
var stackTrace = require('stack-trace');



var schema = Joi.object().keys({
   id: Joi.string().guid().required(),
   created: Joi.date().timestamp('javascript'),
   target_service: Joi.string().min(3).required(),
   origin_service: Joi.string().min(3).required(),
   // url: Joi.string().uri().required(),
   protocol: Joi.string().min(3).required(),
   step: Joi.string().min(3).required(),
   provenance_id: Joi.string().guid().optional(),
   content_type: Joi.string().min(3).required(),
   status: Joi.string().optional(),
   payload: Joi.any().required(),
   channel_op: Joi.string().min(3).regex(/(normal|closed|shutdown)/).required(),
   event_source: Joi.string().min(3).regex(/[a-zA-Z0-9\.-_]/).optional()
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
       throw new Error('Error! problem validating muon message schema: ' + JSON.stringify(validatedMessage.error));
    }
    return message;
}

exports.createMessage = function(payload, headers, source) {
        return createMessage(payload, headers, source);
}

exports.copy = function(json) {
    return jsonutil.deepCopy(json);
}


exports.rpcServer404 = function(rpcMessage) {
    var copy =  jsonutil.deepCopy(rpcMessage);
    var resource = url.format(rpcMessage.requestUrl).pathname;
    copy.target_service = 'unknown';
    copy.origin_service = 'unknown';
    copy.status = "failure";
    copy.step = 'request.invalid';
    copy.url = rpcMessage.requestUrl;
    copy.payload = {status: '404', message: 'no matching resource for url ' + url};
    return copy;
}


exports.resource404 = function(message) {
    var copy =  jsonutil.deepCopy(message);
    var resource = url.format(message.url).pathname;
    copy.target_service = message.origin_service;
    copy.origin_service = message.target_service;
    copy.status = "failure";
    copy.step = 'request.invalid';
    copy.provenance_id = message.id;
    copy.url = message.protocol + '://' + message.origin_service + '/'
    copy.payload = {status: '404', message: 'no matching resource for url ' + url};
    return copy;
}

exports.serverFailure = function(msg, protocol, status, text) {
    var copy =  jsonutil.deepCopy(msg);
    var resource = url.format(msg.url).pathname;
    copy.target_service = msg.origin_service;
    copy.origin_service = msg.target_service;
    copy.status = "failure";
    copy.step = protocol  + '.' + status;
    copy.provenance_id = msg.id;
    copy.url = msg.protocol + '://' + msg.origin_service + '/'
    copy.payload = {status: status, message: text};
    return copy;
}

exports.clientFailure = function(rpcMsg, protocol, status, text) {
    var copy =  jsonutil.deepCopy(rpcMsg);
    copy.status = "failure";
    copy.step = protocol  + '.' + status;
    copy.provenance_id = rpcMsg.id;
    copy.payload = {status: status, message: text};
    return copy;
}

exports.failure = function(protocol, status, text) {
    var payload = {status: status, message: text};
    var headers = {

    };
    var msg =  createMessage(payload, headers);
    msg.status = "failure";
    msg.step = protocol  + '.' + status;
    return msg;
}

exports.muonMessage = function(payload, sourceService, remoteServiceUrl, step) {

   logger.trace("messages.muonMessage(payload='" +  payload + "', sourceService='" +  sourceService + "', remoteServiceUrl='" +  remoteServiceUrl + "')");

    var messageid = uuid.v4();

    var serviceRequest = url.parse(remoteServiceUrl, true);
    //logger.trace('********************************* arguments.callee.caller=' + callingObject());

    var headers = {
          step: step,
          protocol: "request",
          event_source: callingObject(),
          target_service: serviceRequest.hostname,
          origin_service: sourceService,
          url: remoteServiceUrl
    };

   var message = createMessage(payload, headers);
   return validateSchema(message);

};





exports.responseMessage = function(payload, client, server, originalUrl) {

   logger.trace("messages.muonMessage(payload='" +  payload + "', server='" +  server + "', originalUrl='" +  originalUrl + "')");

    var messageid = uuid.v4();

    var serviceRequest = url.parse(remoteServiceUrl, true);
    //logger.trace('********************************* arguments.callee.caller=' + callingObject());

    var headers = {
          step: "request.response",
          protocol: "request",
          event_source: callingObject(),
          target_service: client,
          origin_service: server,
          url: originalUrl
    };

   var message = createMessage(payload, headers);
   return validateSchema(message);

};





function createMessage(payload, headers, source) {
    logger.trace('createMessage(payload='  + JSON.stringify(payload) + ', headers='  + JSON.stringify(headers) +  ')');
    if (! payload) payload = {};
    if (! headers.channel_op) headers.channel_op = 'normal';
    if (! headers.content_type) headers.content_type = 'application/json';
    if (source) headers.event_source = source;
    if (! headers.event_source) headers.event_source = callingObject();
    if (! headers.channel_op) headers.channel_op = 'normal';

    if (typeof payload === 'object') {
        payload = JSON.stringify(payload)
    }
    
    if (typeof payload === 'string' || payload instanceof String) {
        payload = new Buffer(payload)
    }

     var message =  {
       id: uuid.v4(),
       created: new Date().getTime(),
       target_service:  headers.target_service,
       origin_service: headers.origin_service,
       protocol: headers.protocol,
       step:  headers.step,
       provenance_id: headers.provenance_id,
       content_type: headers.content_type,
       status: headers.status,
       payload: payload.toJSON().data,
       channel_op:  headers.channel_op,
       event_source: headers.event_source
     }

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