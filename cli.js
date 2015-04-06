#! /usr/bin/env node

var muonCore = require("./index.js");
var _ = require("underscore");
var uuid = require("node-uuid");

var cli = require('cli').enable('status'); //Enable 2 plugins

cli.parse({
    log:   ['l', 'Enable logging'],
    discovery: ['d', 'the discovery system to use', 'string'],
    discoveryConfig: ['dc', 'the configuration option for the discovery', 'string']
}, [
    "discover",
    "get",
    //"post",
    //"put",
    //"delete",
    //"stream"
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

    cli.spinner('Connecting ... ');

    setTimeout(function () {
        //TODO, get rid of this awful timeout with events coming out of muon instead.
        cli.spinner('', true); //End the spinner

        switch(cli.command) {
            case "discover":
                discoverServices();
                break;
            case "get":
                getService(args);
                break;
            default:
        }
    }, 3500);

});


function getService(args) {

    //TODO, check the first arg is a valud URI

    muon.resource.get(args[0], function(event) {
        //logger.info("Received some data back!");

        var json = JSON.parse(event.payload.data.toString());

        console.log(event.payload.data.toString());
        process.exit(0);
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
    var discovery;
    if (options.discovery == "amqp") {
        var amqp = muonCore.amqpTransport("amqp://localhost:5672");
        discovery = amqp.getDiscovery();

        muon = muonCore.muon('cli', discovery, [
            []
        ]);

        muon.addTransport(amqp);
    } else {
        logger.error("Currently, only AMQP discovery is available. Pull requests welcome");
        process.exit(0);
    }
}
