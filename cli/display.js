
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
        showFooter: showFooter
    };
};

function displayService(analysis) {
    console.log("Service Display!");
}

function displayEndpoint(analysis) {
    console.log("Endpoint display!! not implemented yet :-(");
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