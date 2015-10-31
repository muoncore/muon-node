
var _ = require("underscore");
var RQ = require("async-rq");
require("console.table");

var options;
var Display;
var muon;
var introspectionClient;

module.exports = function(
    localmuon,
    localIntrospectionClient,
    opts) {

    introspectionClient = localIntrospectionClient;
    muon = localmuon;
    options = opts;
    Display = require("./display")(opts);

    return {
        discoverServices:discoverServices
    };
};

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
        Display.displayCapabilities,
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

function exit() {
    process.exit(0);
}
