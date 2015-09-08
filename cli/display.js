
var _ = require("underscore");
var RQ = require("async-rq");
require("console.table");

var options;

module.exports = function(opts) {

    options = opts;

    return {
        displayService: displayService,
        displayServices: displayServices,
        displayStreams: displayStreams,
        displayCommands:displayCommands,
        displayQueries: displayQueries,
        displayCapabilities: displayCapabilities,
        showFooter: showFooter
    };
};

function displayService(analysis) {
    console.log("Service Display!");
}

function displayEndpoint(analysis) {
    console.log("Endpoint display!! not implemented yet :-(");
}

function displayCapabilities(callback, value) {

    //mention service number
    console.log("There are " + value.serviceList.length + " services currently running");
    //is there an event store?
    var eventStore = _.find(value.services, function(it) {
        return _.contains(it.tags, "eventstore");
    });

    if (eventStore === "undefined" || eventStore == null) {
        console.log("\nThere is no event store running\n");
        console.log("\nThe muon 'event' command will not be operational\n");
    } else {
        console.log("\nAn eventstore is running, and calls itself \"" + eventStore.identifier + "\"");
        console.log("\nYou can send a durable event using 'muon event'\n");
        //how many streams etc does it have, asyn callback...?

    }
    return callback(value);
}

function displayServices(callback, value) {

    _.each(value.services, function(svc) {

        var introspection = _.find(value.introspection, function(it) {
            return it.name == svc.identifier;
        });
        if (introspection == null) {
            return;
        }
        svc.version = introspection.version;
        if (svc.version == null) {
            svc.version = "UNKNOWN: ERROR";
        }
    });

    if (options["hide-services"] == null) {
        if (value.services == null || value.services.length == 0) {
            console.log ("There are no active services in the system, nothing can be analysed or displayed.");
            console.log ("Try starting a service up");
        }
        console.table("Active Services", _.collect(value.services, function(val) {
            return {
                name:val.identifier,
                url:"muon://" + val.identifier,
                tags: val.tags,
                "Muon Protocol Version":val.version
            }}));
    }
    return callback(value);
}

function showFooter(callback, value) {
    //TODO, enable this once deeper service and endpoint introspection are enabled
    //console.log("For more information on a particular service use muon -d XXX discover muon://[servicename]");
    //console.log("For more information on an endpoint without a servicename use muon -d XXX discover muon:///[endpoint]");
    return callback(value);
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
                    "Service Name":serviceName,
                    "Stream Name":streamOp.endpoint,
                    Url:"muon://" + serviceName + "/" + streamOp.endpoint
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
                    "Service Name":serviceName,
                    "Endpoint Name":op.endpoint,
                    Url:"muon://" + serviceName + op.endpoint
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
                    "Service Name":serviceName,
                    "Endpoint Name":op.endpoint,
                    Url:"muon://" + serviceName + op.endpoint
                })
            });
    });

    console.table("Command Endpoints", commandOperations);

    return callback(value);
}