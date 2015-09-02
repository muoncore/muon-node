
var _ = require("underscore");
var RQ = require("async-rq");

var EventLogger = function (muon) {
    this.muon = muon;
};

EventLogger.prototype.logEvent = function(channel, event) {

    //TODO, make optional....

    logger.info("Storign event " + event + "from channel " + channel);
    console.dir(event);

    var endpoint = "muon://eventstore/";
    var payload = {

    };

    this.muon.command(endpoint, payload, function() {

    });
};

module.exports = EventLogger;


