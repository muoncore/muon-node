var Joi = require('joi');
var uuid = require('node-uuid');
require('sexylog');
var url = require("url");

var schema = Joi.object().keys({
    id: Joi.string().guid().required(),
    created: Joi.date().timestamp('javascript'),
    payload: Joi.object({
                 data:  Joi.any().required(),
                 "Content-Type": Joi.string(),
                 sourceAvailableContentTypes: Joi.array().unique()
             }).required(),
    headers:  Joi.object().required()
});

exports.create = function(payload, contentType) {

    if (! contentType) {
        contentType = "application/json";
    }
    var eventid = uuid.v4();
     var event = {
                id: eventid,
                created: new Date(),
                headers: {  },
                payload: {
                    data: payload,
                    "Content-Type": contentType,
                    sourceAvailableContentTypes: ["application/json"]
                }
            };

    var response = Joi.validate(event, schema);
    if (response.error) {
        throw new Error('Error! problem validating event schema' + JSON.stringify(response.error));
    }
    return response.value;

};

exports.rpcEvent = function(payload, sourceService, remoteServiceUrl, contentType) {


    var event = exports.create(payload);

    var serviceRequest = url.parse(remoteServiceUrl, true);

     var muonHeaders = {
        id: event.id,
        eventType: "RequestMade",
        protocol: "request",
        targetService: serviceRequest.hostname,
        sourceService: sourceService,
        url: remoteServiceUrl,
        channelOperation: "NORMAL"
     };



    var muonSchema = Joi.object().keys({
        id: Joi.string().guid().required(),
        eventType: Joi.string().min(3).required(),
        protocol:  Joi.string().min(3).required(),
        targetService: Joi.string().min(3).required(),
        sourceService: Joi.string().min(3).required(),
        url: Joi.string().uri().required(),
        channelOperation: Joi.string().min(3).required()
    });


    var validatedMuonHeaders = Joi.validate(muonHeaders, muonSchema);


    if (validatedMuonHeaders.error) {
        logger.error('Error! problem validating event.transport schema' + JSON.stringify(validatedMuonHeaders.error));
        throw new Error('Error! problem validating event.transport with joi schema: ' + JSON.stringify(validatedMuonHeaders.error));
    }

    event.headers = validatedMuonHeaders.value;

    var validatedEvent = Joi.validate(event, schema);
    logger.trace('joi validatedEvent: ' + JSON.stringify(validatedEvent));
    if (validatedEvent.err) {
        throw new Error('Error! problem validating event schema' + JSON.stringify(validatedEvent.err));
    }
    return validatedEvent.value;

};



