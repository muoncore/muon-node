
var _ = require("underscore");
var RQ = require("async-rq");

var IntrospectionClient = function (muon, discoveryService) {
    this.discovery = discoveryService;
    this.muon = muon;
};

IntrospectionClient.prototype.loadEndpoints = function(serviceList, callback) {
    var muon = this.muon;
    var commandInstrospectUrls = _.collect(serviceList, function(serviceName) {
        return {
            name:serviceName,
            uri:"muon://" + serviceName + "/muon/introspect"
        };
    });
    var commandFunctions = _.collect(commandInstrospectUrls, function(serviceInfo) {
        return function requestor(callback) {
            muon.query(serviceInfo.uri, function(val, body) {
                if (val.Status == 200) {
                    callback({
                        name:serviceInfo.name,
                        operations:body.operations,
                        version: body["amqp-protocol-version"]
                    });
                } else {
                    console.log("Service " + serviceInfo.name + " did not respond correctly to introspection, this is a bug in the service or remote Muon implementation. The following lists will be incomplete\n");
                    callback({});
                }
            });
            return function cancel(reason) { console.log("Attempted to cancel introspection, not implemented..." + reason)};
        }
    });

    if (commandFunctions == null || commandFunctions.length == 0) {
        return callback([]);
    }

    RQ.parallel(commandFunctions)(function(introspections) {
        callback(introspections);
    }, {});
};

module.exports = IntrospectionClient;











function analyseUrl(url, callback) {

    console.log("Analysing URL");

    RQ.sequence([
        getTypeOfUrl

    ])(url);

    switch(type) {
        case "service":
            analyseService(url, callback);
            break;
        case "query":
            analyseQuery(url, callback);
            break;
        case "command":
            analyseCommand(url, callback);
            break;
        case "stream":
            analyseStream(url, callback);
            break;
    }

    // is a service, return service info

    // is an fully qualified endpoint. lookup and return

    //if multiple types, what to do?

    //if query
    //      -- params
    //      -- return schema

    //if command
    //    - input/ output schemas

    // if stream
    //    -- params
    //    -- output schema


}

function analyseService(callback, value) {

    callback({
        type:"service"
    });
}

function analyseQuery(url, callback) {

    callback({
        type:"query"
    });
}

function analyseCommand(url, callback) {

    callback({
        type:"command"
    });
}

function analyseStream(url, callback) {

    callback({
        type:"stream"
    });
}

function getTypeOfUrl(url) {

}
