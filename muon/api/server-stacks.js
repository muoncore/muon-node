var _ = require("underscore");
var bichannel = require('../infrastructure/channel');
var rpcProtocol = require('../protocol/rpc.js');
var messages = require('../domain/messages.js');


var ServerStacks = function (serverName) {
   this.serverName = serverName;
};


var handlerMappings = {};

ServerStacks.prototype.openChannel = function(protocol) {
    logger.info("[*** API ***] opening muon server stacks channel...");
    var serverStacksChannel = bichannel.create("serverstacks");
    var rpcProtocolServerHandler = this.rpcApi.protocolHandler().server();
    serverStacksChannel.leftHandler(rpcProtocolServerHandler);
    return serverStacksChannel.rightConnection();
};


ServerStacks.prototype.register = function(endpoint, callback) {
        logger.debug('[*** API ***] registering handler endpoint: ' + endpoint);
        handlerMappings[endpoint] = callback;
};






ServerStacks.prototype.rpc = function(api) {
    this.rpcApi = api;
}

module.exports = ServerStacks;

