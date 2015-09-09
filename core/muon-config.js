/**
 * Provides a method to construct a Muon instance from
 * a json config file.
 *
 * The config should be of the format.
 *
 * {
 * "serviceName":"tck",
 * "tags" : [ "tck", "node"],
 * "discovery": {
 *    "type":"amqp",
 *    "url":"amqp://muon:microservices@localhost"
 *  },
 *  "transports": [
 *     { "type":"amqp", "url":"amqp://something@wibble" }
 *   ]
 * }
 *
 * @type {_|exports}
 * @private
 */

require("../lib/logging/logger");

var EventLogger = require("./introspection/eventlogger");
var AmqpTransport = require("./transport/amqp/muon-transport-amqp");
var AmqpDiscovery = require("./discovery/amqp/muon-discovery-amqp");
var assert = require('assert');
var MuonCore = require("./muon-core");
var _ = require("underscore");
var fs = require("fs");
var RQ = require("async-rq");

var MuonConfig = function () {
};

MuonConfig.prototype.generateMuon = function (serviceName, discoveryUrl) {
    logger.debug("Initialising Muon from Environmental information, checking ...");
    logger.debug("Configuring via function args: discoveryUrl=" + discoveryUrl + ", serviceName=" + serviceName);

    var config = {
        "serviceName": serviceName,
        "tags": [""],
        "discovery": {
            "type": "amqp",
            "url": undefined
        },
        "transports": [
            {"type": "amqp", "url": undefined}
        ]
    };

    var muonDebug = process.env.MUON_CONFIG_DEBUG;
    if (muonDebug) {
        config['eventLogger'] = {
            "target": muonDebug
        }
    }


    var muonConfigUrlEnv = process.env.MUON_CONFIG_URL;
    var muonConfigServiceNameEnv = process.env.MUON_CONFIG_SVC;

    var muonConfigDockerEnv = process.env.RABBITMQ_PORT_5672_TCP_ADDR;

    if (discoveryUrl && serviceName) {
        logger.debug("Configuring via function args: discoveryUrl=" + discoveryUrl + ", serviceName=" + serviceName);
        config.discovery.url = discoveryUrl;
        config.transports[0].url = discoveryUrl;
        config.serviceName = serviceName;
    } else if (muonConfigUrlEnv && muonConfigServiceNameEnv) {
        logger.debug("Configuring muon via shell: $MUON_CONFIG_URL=" + muonConfigUrlEnv + ", $MUON_CONFIG_SVC=" + muonConfigServiceNameEnv);
        config.discovery.url = muonConfigUrlEnv;
        config.transports[0].url = muonConfigUrlEnv;
        config.serviceName = muonConfigServiceNameEnv;
    } else if (muonConfigDockerEnv) {
        logger.debug("Running in a Docker environment with a link to RabbitMQ, autoconfiguring to connect for discovery");
        config.discovery.url = "muon://muon:microservices@" + muonConfigDockerEnv;
        config.transports[0].url = config.discovery.url = "muon://muon:microservices@" + muonConfigDockerEnv;;
    } else {
        // Try a config file
        logger.debug("Trying local file ./muon.config ... ");
        var configFile = './muon.config';

        try {
            config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        } catch (err) {
            logger.error("Error opening config file: ", err);
            throw new Error("Cannot find service config from injection via generateMuon(serviceName, discoveryUrl), $MUON_CONFIG_URL/$MUON_CONFIG_SVC or file " + configFile, err);
        }

    }

    logger.debug("MuonConfig config=", config);

    /*
     if (! config.discovery.url) {
     logger.error("discovery URL missing from config");
     throw new Error("discovery URL missing from config");
     }

     if (! config.transports[0].url) {
     logger.error("transports[0].url missing from config");
     throw new Error("transports[0].url missing from config");
     }

     if (! config.serviceName) {
     logger.error("serviceName missing from config");
     throw new Error("serviceName missing from config");
     }
     */


    var muon;
    _.each(config.transports, function (transport) {
        if (transport.type == "amqp") {
            logger.debug("Initialising AMQP based transport from configuration - " + transport.url);
            // TODO, use the discovery url instead
            var discovery = new AmqpDiscovery(transport.url);
            var amqp = new AmqpTransport(transport.url);
            muon = new MuonCore(
                config.serviceName,
                discovery,
                config.tags);
            if (config.eventLogger != null) {
                muon.setEventLogger(new EventLogger(
                    muon,
                    config.eventLogger.target
                ));
            }
            muon.addTransport(amqp);
        }
    });

    return muon;
};


module.exports = MuonConfig;
