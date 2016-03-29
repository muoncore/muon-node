var Joi = require('joi');
var uuid = require('node-uuid');
require('sexylog');
var url = require("url");

var schema = Joi.object().keys({
   id: Joi.string().guid().required(),
   created: Joi.date().timestamp('javascript'),
   payload: Joi.object({
                data:  Joi.any().required()
            }).required(),
   headers:  Joi.object({
       id: Joi.string().guid().required(),
       eventType: Joi.string().min(3).required(),
       protocol:  Joi.string().min(3).required(),
       targetService: Joi.string().min(3).required(),
       sourceService: Joi.string().min(3).required(),
       url: Joi.string().uri().required(),
       channelOperation: Joi.string().min(3).required(),
       "Content-Type": Joi.string().min(3).required(),
       sourceAvailableContentTypes: Joi.array().required()
   }).required()
});

exports.validate = function(event) {
    return validateSchema(event);
}

function validateSchema(event) {
    var validatedEvent = Joi.validate(event, schema);
    if (validatedEvent.error) {
        logger.warn('invalid event: \n', event);
        logger.info('joi validatedEvent: ' + JSON.stringify(validatedEvent.error.details));
       throw new Error('Error! problem validating rpc event schema: ' + JSON.stringify(validatedEvent.error));
    }
    return event;
}

exports.rpcEvent = function(payload, sourceService, remoteServiceUrl, contentType) {

   logger.trace("events.rpcEvent(payload='" +  payload + "', sourceService='" +  sourceService + "', remoteServiceUrl='" +  remoteServiceUrl + "', contentType='" +  contentType + "')");

      var eventid = uuid.v4();

        if (! contentType) {
            contentType = "application/json";
        }

      var serviceRequest = url.parse(remoteServiceUrl, true);

       var event = {
              id: eventid,
              created: new Date(),
              headers: {
                  id: eventid,
                  eventType: "RequestMade",
                  protocol: "request",
                  targetService: serviceRequest.hostname,
                  sourceService: sourceService,
                  url: remoteServiceUrl,
                  channelOperation: "NORMAL",
                   "Content-Type": "application/json",
                   sourceAvailableContentTypes: ["application/json"]
              },
              payload: {
                  data: payload
              }
          };


   var validatedEvent = Joi.validate(event, schema);
   logger.trace('event: %s', JSON.stringify(event));
   if (validatedEvent.error) {
        logger.warn('invalid event: \n', event);
        logger.debug('joi validatedEvent: ' + JSON.stringify(validatedEvent.error.details));
       throw new Error('Error! problem validating rpc event schema: ' + JSON.stringify(validatedEvent.error));
   }
   return validatedEvent.value;

};


exports.msgToEvent = function(msg) {
    logger.trace('msgToEvent('  + JSON.stringify(msg) + ')');
    var contents = msg.content.toString();
    logger.trace("msgToEvent() contents: '" + contents + "'");
    var payload = JSON.parse(contents);
    logger.trace("msgToEvent() payload: '" + JSON.stringify(payload) + "'");
    var headers = msg.properties.headers;
    var eventid = uuid.v4();
    var event = {
          id: eventid,
          created: new Date(),
          headers: headers,
          payload: {
            data: payload.data
          }
      };
    logger.trace('msgToEvent() return event='  + JSON.stringify(event) );
   return event;
}




exports.messageToEvent = function(msg) {
    logger.trace('messageToEvent('  + JSON.stringify(msg) + ')');
    var contents = msg.payload;
    logger.trace("messageToEvent() contents: '" + contents + "'");
    var payload = contents;
    logger.trace("messageToEvent() payload: '" + JSON.stringify(payload) + "'");
    var headers = msg.headers;
    var eventid = uuid.v4();
    var event = {
          id: eventid,
          created: new Date(),
          headers: headers,
          payload: {
            data: payload
          }
      };
    logger.trace('messageToEvent() return event='  + JSON.stringify(event) );
   return event;
}


exports.eventToMsg = function(event) {
    logger.trace('eventToMsg('  + JSON.stringify(event) + ')');
    var payload = '';
    if (event && event.payload) payload = event.payload;
    if (! payload || payload == null || payload == undefined) {
        payload = {data: ''};
    }
   var msg = {content: payload, headers: event.headers};
    logger.trace('eventToMsg() return msg='  + JSON.stringify(msg));
    return msg;
}
