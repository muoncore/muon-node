
var _ = require("underscore");
var RQ = require("async-rq");
require("console.table");

var options;
var Display;
var muon;
var introspectionClient;

module.exports = function(
    localmuon,
    opts) {

    muon = localmuon;
    options = opts;
    Display = require("./display")(opts);

    return {
        queryService:queryService,
        sendCommand:sendCommand,
        streamService:streamService
    };
};

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
