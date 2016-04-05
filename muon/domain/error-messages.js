//var enum = require('enum');
var messages = require('./messages.js');



exports.create = function(errType, errMsg, err, origMsg, source) {
    logger.trace('errors.create(' + errType + ', ' + errType + ', ' + err + ', ' + origMsg + ')');
    var protocol = 'error';
    if (! origMsg) protocol = origMsg.headers.protocol;
    var headers = {
        event_type: errType + '.' + errMsg,
        origin_id: origMsg.id,
        protocol: protocol
    };
    return messages.createMessage(err, headers, source);
}

exports.isError = function(msg) {
    var isError = false;
    messages.validate(msg);
    event_type = msg.headers.event_type.split('.')[0];
    if (event_type == 'error') {
        isError = true;
    }
    return isError;
}


exports.isException = function(msg) {
    var isException = false;
    messages.validate(msg);
    if (msg.headers.event_type.split('.')[0] == 'exception') {
        isException = true;
    }
    return isException;
}