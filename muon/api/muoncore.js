
var channel = require('../infrastructure/channel.js');
require('sexylog');
var rpc = require('../protocol/rpc');
var introspection = require('../protocol/introspection');
var streaming = require('../protocol/streaming/streaming');
var ServerStacks = require("../../muon/api/server-stacks");
var builder = require("../infrastructure/builder");
var channel = require("../infrastructure/channel")


exports.create = function(serviceName, transportUrl, discoveryUrl) {

    var config = builder.config(serviceName, transportUrl, discoveryUrl);

    var infrastructure = new builder.build(config);

    return this.api(serviceName, infrastructure)
}

exports.channel = function() {
    return channel;
}

exports.ServerStacks=ServerStacks

exports.api = function( serviceName,  infrastructure) {
    var rpcApi = rpc.getApi(serviceName, infrastructure);
    var introspectionApi = introspection.getApi(serviceName, infrastructure);
    var streamingApi = streaming.getApi(serviceName, infrastructure);

    introspectionApi.protocols([rpcApi]);
    infrastructure.serverStacks.addProtocol(rpcApi);
    infrastructure.serverStacks.addProtocol(introspectionApi);
    infrastructure.serverStacks.addProtocol(streamingApi);

    return {
        infrastructure: function() { return infrastructure },
        transportClient: function() { return infrastructure.transport },
        discovery: function () {
            return infrastructure.discovery
        },
        shutdown: function () {
            logger.warn("Shutting down muon!");
            infrastructure.shutdown();
        },
        request: function (remoteServiceUrl, data, clientCallback) {
            return rpcApi.request(remoteServiceUrl, data, clientCallback);
        },
        handle: function(endpoint, callback) {
             rpcApi.handle(endpoint, callback);
        },
        introspect: function(remoteName, callback) {
            return introspectionApi.introspect(remoteName, callback);
        },
        replay: function(remoteurl, config, callback, errorCallback, completeCallback) {
            return streamingApi.replay(remoteurl, config, callback, errorCallback, completeCallback);
        },
        subscribe: function(remoteurl, params, callback, errorCallback, completeCallback) {
            return streamingApi.subscribe(remoteurl, params, callback, errorCallback, completeCallback);
        }
    };
}
