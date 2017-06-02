var channel = require('../infrastructure/channel.js');
require('sexylog');

var ServerStacks = require("./server-stacks");

var MuonSocketAgent = require('../socket/keep-alive-agent');
var channel = require("../infrastructure/channel")

var discoveries = {
  // amqp: require("../discovery/amqp/discovery")
}

var transports = {
  // amqp: require("../transport/amqp/transport")
}

exports.addTransport = (name, transport) => {
  transports[name] = transport
}

exports.addDiscovery = (name, discovery) => {
  discoveries[name] = discovery
}

exports.create = function (serviceName, transportUrl, discoveryUrl, tags) {
    var builder = require("../infrastructure/builder");
    var config = builder.config(serviceName, transportUrl, discoveryUrl);

    var infrastructure = new builder.build(config, transports, discoveries);

    return this.api(serviceName, infrastructure, tags)
}

exports.channel = function () {
    return channel;
}

exports.ServerStacks = ServerStacks
exports.MuonSocketAgent = MuonSocketAgent
exports.Messages = require("../domain/messages")

exports.api = function (serviceName, infrastructure, tags) {

    var introspection = require('../protocol/introspection');

    var introspectionApi = introspection.getApi(serviceName, infrastructure);

    infrastructure.serviceName = serviceName
    infrastructure.introspection = introspectionApi

    infrastructure.serverStacks.addProtocol(introspectionApi);

    logger.info("[*** INFRASTRUCTURE:BOOTSTRAP ***] advertising service '" + serviceName + "' on muon discovery");
    //logger.error('amqpApi=' + JSON.stringify(amqpApi));
    //console.dir(amqpApi);

    if (!tags) {
        tags = ["node", serviceName]
    }

    infrastructure.discovery.advertiseLocalService({
        identifier: serviceName,
        tags: tags,
        codecs: ["application/json"],
        //TODO, more intelligent geenration of connection urls by asking the transports
        connectionUrls: [infrastructure.config.transport_url]
    });

    var api = {
        addServerStack: function(protocol) {
          infrastructure.introspection.addProtocol(protocol)
          infrastructure.serverStacks.addProtocol(protocol);
        },
        infrastructure: function () {
            return infrastructure
        },
        transportClient: function () {
            return infrastructure.transport
        },
        discovery: function () {
            return infrastructure.discovery
        },
        shutdown: function () {
            logger.warn("Shutting down muon!");
            infrastructure.shutdown();
        },
        introspect: function (remoteName, callback) {
            return introspectionApi.introspect(remoteName, callback);
        }
    };

    return api;
}
