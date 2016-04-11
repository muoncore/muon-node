var ServerStacks = require("../../muon/api/server-stacks");


module.exports.build = function(config) {

    var serverStacks = new ServerStacks();

    var infrastructure = {
        config: config,
        discovery: '',
        transport: '',
        serverStacks: serverStacks,
        shutdown: function() {
            //shutdown stuff...
        }
    }

    if (config.discovery.type == "browser") {
        logger.info("Using BROWSER")
        var BrowserDiscovery = require("../../muon/discovery/browser/browser-discovery");
        infrastructure.discovery = new BrowserDiscovery(config.discovery.url);
    } else {
        logger.info("Using AMQP");
        var AmqpDiscovery = require("../../muon/discovery/amqp/amqp-discovery");
        infrastructure.discovery = new AmqpDiscovery(config.discovery.url);
    }

    if (config.transport.type == "browser") {
        var BrowserTransport = require("../../muon/transport/browser/browser-transport");
        infrastructure.transport = new BrowserTransport(config.serviceName, infrastructure.serverStacks, config.transport.url);
    } else {
        var amqpTransport = require('../../muon/transport/rabbit/transport.js');
        var serviceName = infrastructure.config.serviceName;
        var url = infrastructure.config.transport.url;
        infrastructure.transport = amqpTransport.create(serviceName, url, serverStacks, infrastructure.discovery);
    }

    return infrastructure;
}

module.exports.config = function(serviceName, url, type) {
    if (! type) type = "amqp";
    var config = {
        serviceName: serviceName,
        discovery:{
            type: type,
            url: url
        },
        transport:{
            type: type,
            url: url
        }
    };
    return config;
}