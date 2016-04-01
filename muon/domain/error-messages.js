var enum = require('enum');
var messages = require('./messages.js');

var schema = Joi.object().keys({
   id: Joi.string().guid().required(),
   created: Joi.date().timestamp('javascript'),
   payload: Joi.any().required(),
   headers:  Joi.object({
       origin_id: Joi.string().guid().required(),
       event_type: Joi.string().min(3).regex('').required(),
       protocol:  Joi.string().min(3).required(),
       target_service: Joi.string().min(3).required(),
       origin_service: Joi.string().min(3).required(),
       server_reply_q:  Joi.string().min(3).optional(),
       server_listen_q: Joi.string().min(3).optional(),
       url: Joi.string().uri().required(),
       channel_op: Joi.string().min(3).required(),
       content_type: Joi.string().min(3).required(),
       content_types: Joi.array().required()
   }).required()
});

exports.create = function(type, message, object) {




}