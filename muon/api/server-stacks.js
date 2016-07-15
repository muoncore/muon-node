var _ = require("underscore");
var bichannel = require('../infrastructure/channel');
var rpcProtocol = require('../protocol/rpc.js');
var messages = require('../domain/messages.js');
var MuonSocketAgent = require('../socket/agent.js');





var ServerStacks = function (serverName) {
   this.serverName = serverName;
   this.protocols = {};
};



ServerStacks.prototype.openChannel = function(protocolName) {
    logger.info("[*** API ***] opening muon server stacks channel...");
    var serverStacksChannel = bichannel.create("serverstacks");
    var protocol = this.protocols[protocolName];
    if (! protocol) return null;
    var protocolServerHandler = protocol.protocolHandler().server();
    serverStacksChannel.leftHandler(protocolServerHandler);
    var transportChannel = bichannel.create(protocol + "-transport");
    var clintKeepAliveAgent = new MuonSocketAgent(serverStacksChannel, transportChannel, protocolName, 1000);
    return transportChannel.rightConnection();
};




ServerStacks.prototype.addProtocol = function(protocolApi) {
      this.protocols[protocolApi.name()] = protocolApi;
}

ServerStacks.prototype.shutdown = function() {
    
}

module.exports = ServerStacks;
