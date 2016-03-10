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



exports.rpcEvent = function(payload, sourceService, remoteServiceUrl, contentType) {

   logger.trace("events.rpcEvent('" +  payload + "', '" +  sourceService + "', '" +  remoteServiceUrl + "', '" +  contentType + "')");

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
        logger.debug('joi validatedEvent: ' + JSON.stringify(validatedEvent));
       throw new Error('Error! problem validating rpc event schema: ' + JSON.stringify(validatedEvent.error));
   }
   return validatedEvent.value;

};