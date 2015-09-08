require("../lib/logging/logger");

var _ = require("underscore");
var RQ = require("async-rq");
require("console.table");

var options;
var Display;
var muon;
var showCommandOutput;

module.exports = function(
    localmuon,
    opts) {

    muon = localmuon;
    options = opts;
    Display = require("./display")(opts);
    showCommandOutput = !opts["suppress-output"];

    return {
        queryService:queryService,
        sendCommand:sendCommand,
        sendEvent:sendEvent,
        streamService:streamService
    };
};

function sendEvent(args) {

    //TODO, lookup the eventstore.
    muon.discoverServices(function (services) {
        var eventStore = _.find(services, function (it) {
            logger.trace("Checking " + JSON.stringify(it) + ":" + _.contains(it.tags, "eventstore"));
            return _.contains(it.tags, "eventstore");
        });
        if (eventStore == null || eventStore === "undefined") {
            logger.info("No event store is available in the system, events are unable to be dispatched. Use 'muon discover' to see the " + services.length + " running services");
            exit();//
        } else {
            logger.debug("Eventstore is " + eventStore.identifier);
            if (process.stdin.isTTY) {
                processCommand("muon://" + eventStore.identifier + "/events", args[0], function() { process.exit(0); })
            } else {
                processStreamInput(["muon://" + eventStore.identifier + "/events", args[0]])
            }
        }
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

function exit() {
    process.exit(0);
}
