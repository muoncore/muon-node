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

exports.validate = function(message) {
    return validateSchema(message);
}

function validateSchema(message) {
    var validatedMessage = Joi.validate(message, schema);
    if (validatedMessage.error) {
        logger.warn('invalid message: \n', message);
        logger.warn('invalid joi schema for message! details: ' + JSON.stringify(validatedMessage.error.details));
       throw new Error('Error! problem validating rpc message schema: ' + JSON.stringify(validatedMessage.error));
    }
    return message;
}

exports.rpcMessage = function(payload, sourceService, remoteServiceUrl, contentType) {

   logger.trace("messages.rpcMessage(payload='" +  payload + "', sourceService='" +  sourceService + "', remoteServiceUrl='" +  remoteServiceUrl + "', contentType='" +  contentType + "')");

      var messageid = uuid.v4();

        if (! contentType) {
            contentType = "application/json";
        }

      var serviceRequest = url.parse(remoteServiceUrl, true);

       var message = {
              id: messageid,
              created: new Date(),
              headers: {
                  id: messageid,
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
   return validateSchema(message);

};


exports.fromWire = function(msg) {
    logger.trace('messages.fromWire('  + JSON.stringify(msg) + ')');
    var contents = msg.content.toString();
    logger.trace("messages.fromWire() contents: '" + contents + "'");
    var payload = JSON.parse(contents);
    logger.trace("messages.fromWire() payload: '" + JSON.stringify(payload) + "'");
    var headers = msg.properties.headers;
    var messageid = uuid.v4();
    var message = {
          id: messageid,
          created: new Date(),
          headers: headers,
          payload: {
            data: payload.data
          }
      };
    logger.trace('messages.fromWire() return message='  + JSON.stringify(message) );
   return message;
}




