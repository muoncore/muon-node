var _ = require("underscore");
var bichannel = require('./infrastructure/channel');

var ServerStacks = function (transport) {
    this.transport = transport;
};

ServerStacks.prototype.openChannel = function(protocol) {

};

module.exports = ServerStacks;

