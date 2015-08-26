
var _ = require("underscore");
var muonCore = require("../muon");

var muon = muonCore.generateMuon();

var queueEvents = [];

muon.onQuery("/tckQueueRes","", function(request, message, response) {
    response(queueEvents);
});

var events = [];

//setInterval(function() {
//    muon.broadcast.emit("echoBroadcast", {reply: "test"}, {identifier: "Emitted Test"});
//},3500);

//muon.stream.provideStream("/something", function(subscriber) {
//
//    //todo, the reactive streams API here ...
//
//    var subscription = {
//        //request
//        subscribe: function() {
//
//        }
//    };
//
//    return stream;
//});

muon.on("echoBroadcast", function(event, payload) {
    muon.broadcast.emit("echoBroadcastResponse", {}, payload);
});

muon.on("echoBroadcastResponse", function(event) {
    logger.info("Received an echoBroadcastResponse");
    //console.dir(JSON.parse(event.payload.toString()));
});

muon.on("tckBroadcast", function(event, payload) {
    logger.info("Got an event " + payload);
    events.push(payload);
});

muon.onQuery("/discover", "Get the events", function(event, data, respond) {
    muon.discoverServices(function(services) {
        logger.info('Discovery called');
        respond(_.collect(services, function(it) {
            return it.identifier;
        }));
    });
});

muon.onQuery("/event", "Get the events", function(event, data, respond) {
    respond(events);
});

muon.onCommand("/eventclear", "Allow post of some data", function(event, data, respond) {
    logger.info("Clearing the event data");
    events = [];
    respond();
});

muon.onCommand("/echo", "Allow post of some data", function(event, data, respond) {
    respond({
        "something":"awesome",
        "method":"command!"
    });
});

muon.onQuery("/echo", "Allow post of some data", function(event, data, respond) {
    respond({
        "something":"awesome",
        "method":"query"
    });
});

var requestStore = {};

muon.onQuery("/invokeresponse", "hh", function(event, data, respond) {

    muon.query(data.resource, function(event, payload) {
        logger.info("We have a GET response");
        console.dir(payload);
        requestStore = payload;
        respond(payload);
    });
});

muon.onCommand("/invokeresponse-store", "hh", function(event, data, respond) {
    logger.info("invokeresponse-store has been requested");
    respond(requestStore);
});


logger.info("Starting Muon Node TCK Service");
logger.info("This service implements the endpoints and streams specified at http://www.github.com/muoncore/muon-protocol-specifications and will, by running those specifications against this service, certify this Muon library as compatible with the Muon ecosystem");
logger.info("For more information, see https://github.com/muoncore/muon-documentation");









