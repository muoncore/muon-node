var _ = require("underscore");
var bichannel = require('../infrastructure/channel');
var rpcProtocol = require('../protocol/rpc.js');
var messages = require('../domain/messages.js');
var MuonSocketAgent = require('../socket/agent.js');





var ServerStacks = function (serverName) {
   this.serverName = serverName;
   this.protocols = {};
};



ServerStacks.prototype.openChannel = function(protocol) {
    logger.info("[*** API ***] opening muon server stacks channel...");
    var serverStacksChannel = bichannel.create("serverstacks");
    var protocol = this.protocols[protocol];
    if (! protocol) return null;
    var protocolServerHandler = protocol.protocolHandler().server();
    serverStacksChannel.leftHandler(protocolServerHandler);

    var agent = new MuonSocketAgent();
    agent.upstream(serverStacksChannel.rightConnection());

    var transportChannel = bichannel.create("socket-agent");

    agent.downstream(transportChannel.leftConnection());

    return transportChannel.rightConnection();
};




ServerStacks.prototype.addProtocol = function(protocolApi) {
      this.protocols[protocolApi.name()] = protocolApi;
}

module.exports = ServerStacks;
