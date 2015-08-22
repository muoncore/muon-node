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

var muonCore = require("../index.js");
var _ = require("underscore");
var fs = require("fs");
var RQ = require("async-rq");


var MuonConfig = function () {};

MuonConfig.prototype.generateMuon = function() {
    logger.debug("Initialising Muon from Environmental information, checking ...");

    logger.debug("Trying MUON_CONFIG ... ");
    logger.debug("   MUON_CONFIG is being ignored ... ");

    logger.debug("Trying local muon.config ... ");
    var configFile = './muon.config';

    //needs generifying.
    var config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

    var muon;
    _.each(config.transports, function(transport) {
        if (transport.type == "amqp") {
            logger.debug("Initialising AMQP based transport from configuration - " + transport.url);
            var amqp = muonCore.amqpTransport(transport.url);
            muon = muonCore.muon(config.serviceName, amqp.getDiscovery(), config.tags);
            muon.addTransport(amqp);
        }
    });

    return muon;
};

module.exports = MuonConfig;
