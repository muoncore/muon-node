#! /usr/bin/env node

require("./lib/logging/logger");

var AmqpTransport = require("./core/transport/amqp/muon-transport-amqp");
var AmqpDiscovery = require("./core/discovery/amqp/muon-discovery-amqp");
var MuonCore = require("./core/muon-core");
var _ = require("underscore");
var uuid = require("node-uuid");
var fs = require('fs');
var RQ = require("async-rq");
var Display;
var Discovery;
var Actions;
require("console.table");

var IntrospectionClient = require("./core/introspection/introspection-client");

var cli = require('cli').enable('status'); //Enable 2 plugins

var discoveryConfig;
var discoveryConfigFile;

try {
    discoveryConfigFile = getUserHome() + '/.muon/discovery.json';
    discoveryConfig = JSON.parse(fs.readFileSync(discoveryConfigFile, 'utf8'));
} catch(e) {
    noConfigFile(discoveryConfigFile);
}

cli.parse({
    discovery: ['d', 'the discovery configuration to use from the config file', 'string'],
    "suppress-output": ['s', 'suppress command output (eg, when streaming)'],
    "hide-services":  ['', 'Do not display the discovered services'],
    "all":  ['a', 'Discover everything about a system'],
    "streams":  ['s', 'Show discovered streams in the system'],
    "queries":  ['q', 'Show discovered available queries'],
    "commands":  ['c', 'Show discovered commands']
},
{
    "setup": "Generate a default configuration",
    "discover":"Allow inspection of the current system",
    "query":"Call a query endpoint",
    "command":"Submit a command to a remote service. Auto detects when used in a unix pipe and submits one command per line of input",
    "event":"Dispatch an event to the system Event Store. Auto detects when used in a unix pipe and submits one event per line of input. A special type of command with dynamic lookup of Event Store endpoint and wrapping schema",
    "stream":"Tap into a remote stream exposed by a service and output to standard out"
});

var muon;
var introspectionClient;
var options;
var args;

cli.main(function(arguments, opts) {

    options = opts;
    args = arguments;

    if (cli.command === "setup") {
        setupConfig();
        logger.info("Default configuration has been generated at " + discoveryConfigFile);
        return;
    }

    initialiseMuon(options);

    Display = require("./cli/display")(options);
    Discovery = require("./cli/discovery")(
        muon,
        introspectionClient,
        options);
    Actions = require("./cli/actions")(muon, options);

    if (process.stdin.isTTY) {
        cli.spinner('Connecting ... ');
    }
    muon.onReady(function () {
        if (process.stdin.isTTY) {
            cli.spinner("", true);
        }
        switch(cli.command) {
            case "discover":
                Discovery.discoverServices(options);
                break;
            case "query":
                Actions.queryService(args);
                break;
            case "command":
                Actions.sendCommand(args);
                break;
            case "stream":
                Actions.streamService(args);
                break;
            case "event":
                Actions.sendEvent(args);
                break;
            default:
        }
    });
});

function setupConfig() {
    var defaultConfig = [{
        "name":"local",
        "type":"amqp",
        "uri":"amqp://localhost",
        "default":true
    }];

    fs.writeFile(discoveryConfigFile, JSON.stringify(defaultConfig), function(err) {
        if(err) {
            logger.warn("FAILED" + err);
            return console.log(err);
        }

        logger.warn("A default configuration has been created, view it at " + discoveryConfig);
    });
}

function exit() {
    process.exit(0);
}

function initialiseMuon(options) {
    var discovery = _.find(discoveryConfig, function(it) {
        return it.name == options.discovery;
    });

    if (typeof discovery === 'undefined' && discoveryConfig.length == 1) {
        discovery = discoveryConfig[0];
        logger.debug("Only one discovery configuration, selecting: " + discovery.name);
    }
    if (typeof discovery === 'undefined') {
        discovery = _.find(discoveryConfig, function(it) {
            return it.default == true;
        });
        if (discovery !== "undefined") {
            logger.debug("Selected default discovery configuration: " + discovery.name);
        }
    }

    if (typeof discovery !== 'undefined') {
        switch(discovery.type) {
            case "amqp":
                var amqp = new AmqpTransport(discovery.uri);
                discovery = new AmqpDiscovery(discovery.uri);

                muon = new MuonCore("cli", discovery, [
                    "cli", "node"
                ]);

                muon.addTransport(amqp);
                break;
            default:
                logger.error("Discovery type is not supported: " + discovery.type);
        }
        introspectionClient = new IntrospectionClient(muon, discovery);
    } else {
        logger.error("No discovery configuration with the name: " + options.discovery);
        var configs = _.collect(discoveryConfig, function(it) {
            return it.name;
        });
        logger.info("Available configurations : " + configs);
        exit();
    }
}

function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function noConfigFile(discoveryConfigFile) {
    console.log("\n\nNo Discovery file found at " + discoveryConfigFile);
    console.log("You can generate a default file by running 'muon setup'\n\n");
}
