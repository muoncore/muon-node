
var _ = require("underscore");

var IntrospectionResources = function (muon) {
    var queries  = IntrospectionResources.prototype.queries  = [];
    var commands = IntrospectionResources.prototype.commands = [];
    var streams  = IntrospectionResources.prototype.streams  = [];

    muon.readyWait(function() {

        muon.resource.onQuery("/muon/introspect", "The introspection endpoint", function (event, data, respond) {
            var operations = [];

            _.each(queries, function(it) {
                operations.push({endpoint: it, method: 'query'});
            });

            _.each(commands, function(it) {
                operations.push({endpoint: it, method: 'command'});
            });

            _.each(streams, function(it) {
                operations.push({endpoint: it, method: 'stream'});
            });

            respond({
                "amqp-protocol-version":5,
                operations: operations
            });
        });
    });
};

IntrospectionResources.prototype.addQuery = function(queryname) {
    this.queries.push(queryname);
};
IntrospectionResources.prototype.addStream = function(queryname) {
    this.streams.push(queryname);
};
IntrospectionResources.prototype.addCommand = function(queryname) {
    this.commands.push(queryname);
};

module.exports = IntrospectionResources;
