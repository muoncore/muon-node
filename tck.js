
var _ = require("underscore");
var muonCore = require("./index.js");

var amqp = muonCore.amqpTransport("amqp://localhost:5672");
var muon = muonCore.muon('tck', amqp.getDiscovery(), [
    ["my-tag", "tck-service", "node-service"]
]);
muon.addTransport(amqp);

var queueEvents = [];

setTimeout(function() {
    //TODO, get rid of this awful timeout.
    muon.queue.listen("tckQueue", function(event) {
        queueEvents = [];
        queueEvents.push(event.payload);
    });

    muon.queue.listen("tckQueueSend", function(event) {
        var responseQueue = event.payload.data;
        muon.queue.send(responseQueue, {"something":"ofvalue!"});
    });
    muon.resource.onGet("/tckQueueRes","", function(request, message, response) {
        response(queueEvents);
    });


var events = [];

setInterval(function() {
    muon.broadcast.emit("echoBroadcast", {reply: "test"}, {identifier: "Emitted Test"});
},3500);

muon.broadcast.on("echoBroadcast", function(event) {
    muon.broadcast.emit("echoBroadcastResponse", {}, JSON.parse(event.payload.toString()));
});

muon.broadcast.on("echoBroadcastResponse", function(event) {
    logger.info("Received the response");
    //console.dir(JSON.parse(event.payload.toString()));
});

muon.broadcast.on("tckBroadcast", function(event) {
    logger.info("Got an event " + event.payload.toString());
    var payload = JSON.parse(event.payload.toString());
    events.push(payload);
});

muon.resource.onGet("/discover", "Get the events", function(event, data, respond) {
    muon.discoverServices(function(services) {
        logger.info('Discovery called');
        respond(_.collect(services, function(it) {
            return it.identifier;
        }));
    });
});

muon.resource.onGet("/event", "Get the events", function(event, data, respond) {
    respond(events);
});

muon.resource.onDelete("/event", "Delete the events", function(event, data, respond) {
    events = [];
    respond({
    });
});

muon.resource.onGet("/echo", "Allow get of some data", function(event, data, respond) {
    respond({
        "something":"awesome",
        "method":"GET"
    });
});

muon.resource.onPost("/echo", "Allow post of some data", function(event, data, respond) {
    respond({
        "something":"awesome",
        "method":"POST"
    });
});

muon.resource.onDelete("/echo", "Allow delete of some data", function(event, data, respond) {
    respond({
        "something":"awesome",
        "method":"DELETE"
    });
});

muon.resource.onPut("/echo", "Allow put of some data", function(event, data, respond) {
    respond({
        "something":"awesome",
        "method":"PUT"
    });
});

}, 500);


logger.info("Starting Muon Node TCK");









