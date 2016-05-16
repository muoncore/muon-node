var Joi = require('joi');
var uuid = require('node-uuid');
require('sexylog');
var jsonutil = require('jsonutil');
var stackTrace = require('stack-trace');



/**
 * 
 * Reactive Streams Muon protocol message schemas
 * 
 */
/**
 * 
 * TODO, should get muon messages out of these with the correct/ validated types.
 * 
 * TODO, need some way to pass in a message and have it validated
 * 
 */
var SubscriptionRequested = Joi.object().keys({
    streamName: Joi.string().required(),
    args: Joi.array().optional()
});

var SubAck = Joi.object().keys({

});

var SubNack = Joi.object().keys({

});
var DataRequested = Joi.object().keys({

});
var Cancelled = Joi.object().keys({

});
var Data = Joi.object().keys({

});
var Completed = Joi.object().keys({

});
var Errored = Joi.object().keys({

});
var ProtocolFailure = Joi.object().keys({

});


var Subscribe = Joi.object().keys({
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