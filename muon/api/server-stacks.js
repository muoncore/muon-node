var _ = require("underscore");
var bichannel = require('../infrastructure/channel');
var rpcProtocol = require('../protocol/rpc.js');
var messages = require('../domain/messages.js');





var ServerStacks = function (serverName) {
   this.serverName = serverName;
   this.protocols = {};
};



ServerStacks.prototype.openChannel = function(protocol) {
    logger.info("[*** API ***] opening muon server stacks channel...");
    var serverStacksChannel = bichannel.create("serverstacks");
    var protocolServerHandler = this.protocols[protocol].protocolHandler().server();
    serverStacksChannel.leftHandler(protocolServerHandler);
    return serverStacksChannel.rightConnection();
};




ServerStacks.prototype.addProtocol = function(protocolApi) {
      this.protocols[protocolApi.name()] = protocolApi;
}

module.exports = ServerStacks;
