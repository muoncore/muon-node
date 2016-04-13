
var nodeUrl = require("url");
//var RpcProtocol = require('../protocol/rpc-protocol.js');
var channel = require('../infrastructure/channel.js');
var uuid = require('node-uuid');
var RSVP = require('rsvp');
require('sexylog');
var rpc = require('../protocol/rpc');
var messages = require('../domain/messages.js');
var ServerStacks = require("../../muon/api/server-stacks");
var amqpTransport = require('../../muon/transport/rabbit/transport.js');
var builder = require("../infrastructure/builder");



exports.create = function(serviceName, url) {

    var config = builder.config(serviceName, url);

    var infrastructure = new builder.build(config, rpcApi);
    var rpcApi = rpc.getApi('server', infrastructure.transport);
    infrastructure.serverStacks.rpc(rpcApi);


    var muonApi = {
        discovery: function() { return infrastructure.discovery },
        shutdown: function() {
            logger.warn("Shutting down muon!");
            infrastructure.shutdown();
        },
        request: function(remoteServiceUrl, data, clientCallback) {
            return rpcApi.request(remoteServiceUrl, data, clientCallback);
        },
        handle: function(endpoint, callback) {
             rpcApi.handle(endpoint, callback);
        }
    };
    return muonApi;
}

