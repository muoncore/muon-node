
var _ = require("underscore");
var RQ = require("async-rq");

var EventLogger = function (muon) {
    this.muon = muon;
};

EventLogger.prototype.logEvent = function(channel, event) {

    if (event.payload.bypasslogging) { return; }
    //this is a response from photon, so don't attempt to persist it otherwise we'll generate an eternal loop
    if (
        event.payload != null &&
        event.payload.correct != null
    ) { return; }
    var endpoint = "muon://eventstore/events";

    event.bypasslogging=true;

    var payload = {
        //"stream-name":"simples",
        //sender: "muon://foo",
        //receiver: "muon://photon",
        //verb: "query",
        //uuid: "0d35c44f-89a7-4abd-b4ce-e313aaa75c37",
        //"in-reply-to": "c0687d0c-9219-45fe-9990-fa12e2f95736",
        //"server-timestamp": 1437646327886,
        //"schema": "http://cistechfutures.net/foo.schema",
        //protocol: "fire-and-forget",
        //encoding: "application/json",
        payload: event,
        bypasslogging:true
    };
    console.dir(payload);

    this.muon.command(endpoint, payload, function(event, responsepayload) {
        logger.debug("Event sent, response is " + event.Status);
    });
};

module.exports = EventLogger;


