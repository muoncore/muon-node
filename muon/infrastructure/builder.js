
var ServerStacks = require("../../muon/api/server-stacks");
var TransportClient = require("../../muon/transport/transport-client");

module.exports = function(config) {

    var infrastructure = {};
    infrastructure.serverStacks = new ServerStacks();

    if (config.hasOwnProperty("type")) {
        config.discovery.type = config.type;
        config.transport.type = config.type;
        config.discovery.url = config.url;
        config.transport.url = config.url;
    }

    if (config.discovery.type == "browser") {
        logger.info("Using BROWSER")
        var BrowserDiscovery = require("../../muon/discovery/browser/browser-discovery");

        infrastructure.discovery = new BrowserDiscovery(config.discovery.url);
    } else {
        logger.info("Using AMQP");
        var AmqpDiscovery = require("../../muon/discovery/amqp/amqp-discovery");

        infrastructure.discovery = new AmqpDiscovery(config.discovery.url);
        infrastructure.discovery.advertiseLocalService({
            identifier:config.serviceName,
            tags:["node", config.serviceName],
            codecs:["application/json"]
        });
    }

    if (config.transport.type == "browser") {
        var BrowserTransport = require("../../muon/transport/browser/browser-transport");
        infrastructure.transport = new BrowserTransport(config.serviceName, infrastructure.serverStacks, config.transport.url);
    } else {
        var AmqpTransport = require("../../muon/transport/amqp/amqp09-transport");
        infrastructure.transport = new AmqpTransport(config.serviceName, infrastructure.serverStacks.openChannel(), config.transport.url);
    }

    infrastructure.transportClient = new TransportClient(infrastructure.transport);

    return infrastructure;
}