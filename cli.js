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
require("console.table");

var IntrospectionClient = require("./core/introspection/introspection-client");

var cli = require('cli').enable('status'); //Enable 2 plugins

var discoveryConfig;
var discoveryConfigFile;
var showCommandOutput;

try {
    discoveryConfigFile = getUserHome() + '/.muon/discovery.json';
    discoveryConfig = JSON.parse(fs.readFileSync(discoveryConfigFile, 'utf8'));
} catch(e) {
    noConfigFile(discoveryConfigFile);
}

cli.parse({
    log:   ['l', 'Enable logging'],
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
    "stream":"Tap into a remote stream exposed by a service and output to standard out"
});

var muon;
var introspectionClient;
var options;
var args;

cli.main(function(arguments, opts) {

    options = opts;
    args = arguments;

    Display = require("./cli/display.js")(options);

    if (cli.command === "setup") {
        setupConfig();
        logger.info("Default configuration has been generated at " + discoveryConfigFile);
        return;
    }

    showCommandOutput = !options["suppress-output"];

    if (options.log) {
        //GLOBAL.logger = Logger('muon', "info", '/tmp/muon.log', true,
        //    "console-plus");
    } else {
        //GLOBAL.logger = Logger('muon', "warn", '/tmp/muon.log', true,
        //    "console-plus");
    }

    initialiseMuon(options);

    if (process.stdin.isTTY) {
        cli.spinner('Connecting ... ');
    }
    muon.onReady(function () {
        if (process.stdin.isTTY) {
            cli.spinner("", true);
        }
        switch(cli.command) {
            case "discover":
                discoverServices(options);
                break;
            case "query":
                queryService(args);
                break;
            case "command":
                sendCommand(args);
                break;
            case "stream":
                streamService(args);
                break;
            default:
        }
    });
});

function setupConfig() {
    var defaultConfig = [{
        "name":"local",
        "type":"amqp",
        "uri":"amqp://localhost"
    }];

    fs.writeFile(discoveryConfigFile, JSON.stringify(defaultConfig), function(err) {
        if(err) {
            logger.warn("FAILED" + err);
            return console.log(err);
        }

        logger.warn("A default configuration has been created, view it at " + discoveryConfig);
    });
}

function sendCommand(args) {
    if (process.stdin.isTTY) {
        processCommand(args[0], args[1], function() { process.exit(0); })
    } else {
        processStreamInput(args)
    }
}

function processStreamInput(args) {

    var streamCompleted = false;

    process.stdin.pipe(require('split')()).on('data', processLine).on("end", function() {
        streamCompleted = true;
    });

    var commandsOutstanding = 0;

    function processLine (line) {
        if (line != null && line.length > 0) {
            commandsOutstanding++;
            processCommand(args[0], line, function(){
                commandsOutstanding--;
                if (commandsOutstanding == 0 && streamCompleted) {
                    exit();
                }
            });
        }
    }
}

function processCommand(url, payloadString, done) {
    var json = JSON.parse(payloadString);
    muon.command(url, json, function(event, payload) {
        try {
            if (event.Status == "404") {
                logger.error("Service returned 404 when accessing " + args[0]);
            } else {
                if (showCommandOutput) {
                    console.dir(payload);
                }
            }
        } catch (e) {
            logger.error("Failed to render the response", e);
        }
        done();
    });
}


function queryService(args) {

    //TODO, check the first arg is a valud URI

    muon.query(args[0], function(event, payload) {
        try {
            if (event.Status == "404") {
                logger.error("Service returned 404 when accessing " + args[0]);
            } else {
                console.dir(payload);
            }
        } catch (e) {
            logger.error("Failed to render the response", e);
        }
        exit();
    });
}

function streamService(args) {

    //TODO, check the first arg is a valid URI
    muon.subscribe(args[0], function(event, payload) {
        console.log(JSON.stringify(payload));
    });
}

function discoverServices() {

    //if (args[0] != null) {
    //    introspection.analyseUrl(args[0], function(analysis) {
    //
    //        switch(analysis.type) {
    //            case "service":
    //                Display.displayService(analysis);
    //                break;
    //            case "query":
    //                Display.displayEndpoint(analysis);
    //                break;
    //            case "command":
    //                Display.displayEndpoint(analysis);
    //                break;
    //            case "stream":
    //                Display.displayEndpoint(analysis);
    //                break;
    //        }
    //
    //        exit();
    //    });
    //    return;
    //}

    var workflow = RQ.sequence([
        discoverServiceList,
        introspectServices,
        Display.displayServices,
        Display.displayStreams,
        Display.displayQueries,
        Display.displayCommands,
        Display.showFooter,
        exit
    ]);

    workflow(function() {
        console.log("Completed workflow");
    }, {});
}

function introspectServices(callback, value) {

    introspectionClient.loadEndpoints(value.serviceList, function(introspections) {
        logger.debug("Endpoints have been loaded from the discovery system");
        callback({
            introspection:introspections,
            serviceList:value.serviceList,
            services:value.services
        })
    });

    return function cancel(reason) {
        console.log("Asked to cancel?");
    };
}

function exit() {
    process.exit(0);
}

function discoverServiceList(callback) {
    muon.discoverServices(function (services) {
        var serviceList = _.collect(services, function (it) {
            return it.identifier;
        });
        callback({
            services:services,
            serviceList:serviceList
        });
    });
    return function cancel(reason) {
      console.log("Asked to cancel?");
    };
}


function initialiseMuon(options) {
    var discovery = _.find(discoveryConfig, function(it) {
        return it.name == options.discovery;
    });

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
