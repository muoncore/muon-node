var _ = require("underscore");
var bichannel = require('./infrastructure/channel');

var ServerStacks = function (transport) {
    this.transport = transport;
};

ServerStacks.prototype.openChannel = function(protocol) {

    logger.info("I AM CALLED, BE AT PEACE" + protocol);


};

module.exports = ServerStacks;

