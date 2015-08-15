#! /usr/bin/env node

var muonCore = require("./index.js");
var _ = require("underscore");
var uuid = require("node-uuid");
var fs = require('fs');
var RQ = require("async-rq");
require("console.table");

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
var options;

cli.main(function(args, opts) {

    options = opts;

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
    muon.resource.command(url, json, function(event, payload) {
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

    muon.resource.query(args[0], function(event, payload) {
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
    muon.stream.subscribe(args[0], function(event, payload) {
        console.log(JSON.stringify(payload));
    });
}

function discoverServices(options) {

    var workflow = RQ.sequence([
        discoverServiceList,
        introspectServices,
        displayServices,
        displayStreams,
        displayQueries,
        displayCommands,
        showFooter,
        exit
    ]);

    workflow(function() {
        console.log("Completed workflow");
    }, {});
}

function showFooter(callback, value) {
    //TODO, enable this once deeper service and endpoint introspection are enabled
    //console.log("For more information on a particular service use muon -d XXX discover muon://[servicename]");
    //console.log("For more information on an endpoint without a servicename use muon -d XXX discover muon:///[endpoint]");
    return callback(value);
}

function introspectServices(callback, value) {

    var commandInstrospectUrls = _.collect(value.serviceList, function(serviceName) {
        return {
            name:serviceName,
            uri:"muon://" + serviceName + "/muon/introspect"
        };
    });
    var commandFunctions = _.collect(commandInstrospectUrls, function(serviceInfo) {
        return function requestor(callback) {
            muon.resource.query(serviceInfo.uri, function(val, body) {
                if (val.Status == 200) {
                    callback({
                        name:serviceInfo.name,
                        operations:body.operations
                    });
                } else {
                    console.log("Service " + serviceInfo.name + " did not respond correctly to introspection, this is a bug in the service or remote Muon implementation. The following lists will be incomplete\n");
                    callback({});
                }
            });
            return function cancel(reason) { console.log("Attempted to cancel introspection, not implemented..." + reason)};
        }
    });

    RQ.parallel(commandFunctions)(function(introspections) {
        callback({
            introspection:introspections,
            serviceList:value.serviceList,
            services:value.services
        });
    }, value);

    return function cancel(reason) {
        console.log("Asked to cancel?");
    };
}

function exit() {
    process.exit(0);
}

function displayServices(callback, value) {

    if (options["hide-services"] == null) {
        console.table("Active Services", _.collect(value.services, function(val) {
            return {
                name:val.identifier,
                url:"muon://" + val.identifier,
                tags: val.tags
            }}));
    }
    return callback(value);
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


function displayStreams(callback, value) {
    if (options["streams"] == null && options["all"] == null) {
        return callback(value);
    }

    var streamOperations = [];

    _.each(value.introspection, function(serviceOperations) {
        var serviceName = serviceOperations.name;

        _.each(
        _.filter(serviceOperations.operations, function(operation) {
            return operation.method == "stream";
        }), function(streamOp) {
                streamOperations.push({
                    serviceName:serviceName,
                    streamName:streamOp.endpoint,
                    url:"muon://" + serviceName + "/" + streamOp.endpoint
                })
            });
    });

    console.table("Reactive Streams", streamOperations);

    return callback(value);
}

function displayQueries(callback, value) {
    if (options["queries"] == null && options["all"] == null) {
        return callback(value);
    }

    var queryOperations = [];

    _.each(value.introspection, function(serviceOperations) {
        var serviceName = serviceOperations.name;

        _.each(
            _.filter(serviceOperations.operations, function(operation) {
                return operation.method == "query";
            }), function(op) {
                queryOperations.push({
                    serviceName:serviceName,
                    endpointName:op.endpoint,
                    url:"muon://" + serviceName + op.endpoint
                })
            });
    });

    console.table("Query Endpoints", queryOperations);

    return callback(value);
}

function displayCommands(callback, value) {
    if (options["commands"] == null && options["all"] == null) {
        return callback(value);
    }

    var commandOperations = [];

    _.each(value.introspection, function(serviceOperations) {
        var serviceName = serviceOperations.name;

        _.each(
            _.filter(serviceOperations.operations, function(operation) {
                return operation.method == "command";
            }), function(op) {
                commandOperations.push({
                    serviceName:serviceName,
                    endpointName:op.endpoint,
                    url:"muon://" + serviceName + op.endpoint
                })
            });
    });

    console.table("Command Endpoints", commandOperations);

    return callback(value);
}

function initialiseMuon(options) {
    var discovery = _.find(discoveryConfig, function(it) {
        return it.name == options.discovery;
    });

    if (typeof discovery !== 'undefined') {
        switch(discovery.type) {
            case "amqp":
                var amqp = muonCore.amqpTransport(discovery.uri);
                discovery = amqp.getDiscovery();

                muon = muonCore.muon('cli', discovery, [
                    []
                ]);

                muon.addTransport(amqp);
                break;
            default:
                logger.error("Discovery type is not supported: " + discovery.type);
        }
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
