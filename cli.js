#! /usr/bin/env node

var muonCore = require("./index.js");
var _ = require("underscore");
var uuid = require("node-uuid");
var fs = require('fs');

var cli = require('cli').enable('status'); //Enable 2 plugins

var discoveryConfig;
try {
    discoveryConfigFile = getUserHome() + '/.muon/discovery.json';
    discoveryConfig = JSON.parse(fs.readFileSync(discoveryConfigFile, 'utf8'));
} catch(e) {
    logger.warn("No Discovery file found at " + discoveryConfig);
    logger.warn("You must create one before proceeding" + discoveryConfig);
}

cli.parse({
    log:   ['l', 'Enable logging'],
    discovery: ['d', 'the discovery configuration to use from the config file', 'string']
}, [
    "discover",
    "query",
    "command",
    "stream"
]);

var muon;

cli.main(function(args, options) {

    if (options.log) {
        //GLOBAL.logger = Logger('muon', "info", '/tmp/muon.log', true,
        //    "console-plus");
    } else {
        //GLOBAL.logger = Logger('muon', "warn", '/tmp/muon.log', true,
        //    "console-plus");
    }

    initialiseMuon(options);

    //cli.spinner('Connecting ... ');

    setTimeout(function () {
        //TODO, get rid of this awful timeout with events coming out of muon instead.
        //cli.spinner('', true); //End the spinner

        switch(cli.command) {
            case "discover":
                discoverServices();
                break;
            case "query":
                getService(args);
                break;
            case "command":
                postService(args);
                break;
            case "stream":
                streamService(args);
                break;
            default:
        }
    }, 3500);
});

function postService(args) {

    //TODO, check the first arg is a valud URI
    muon.resource.command(args[0], args[1], function(event, payload) {
        try {
            if (event.Status == "404") {
                logger.error("Service returned 404 when accessing " + args[0]);
            } else {
                console.dir(payload);
            }
        } catch (e) {
            logger.error("Failed to render the response", e);
        }
        process.exit(0);
    });
}

function getService(args) {

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
        process.exit(0);
    });
}

function streamService(args) {

    //TODO, check the first arg is a valid URI
    muon.stream.subscribe(args[0], function(event, payload) {
        console.log(JSON.stringify(payload));
    });
}

function discoverServices() {
    muon.discoverServices(function (services) {
        var serviceList = _.collect(services, function (it) {
            return it.identifier;
        });
        logger.info("Discovered Services", serviceList);
        console.dir(services);
        process.exit(0);
    });
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
        process.exit(1);
    }
}

function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}