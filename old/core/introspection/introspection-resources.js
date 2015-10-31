
var _ = require("underscore");

var IntrospectionResources = function (muon) {
    this.muon = muon;
    this.queries  = [];
    this.commands = [];
    this.streams  = [];
};

IntrospectionResources.prototype.startup = function() {
    var _this = this;
    _this.muon.readyWait(function() {
        _this.muon.onQuery("/muon/introspect", function (event, data, respond) {
            var operations = [];

            _.each(_this.queries, function(it) {
                operations.push({endpoint: it, method: 'query'});
            });

            _.each(_this.commands, function(it) {
                operations.push({endpoint: it, method: 'command'});
            });

            _.each(_this.streams, function(it) {
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
