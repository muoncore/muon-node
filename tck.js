
var _ = require("underscore");
var muonCore = require("./index.js");

var amqp = muonCore.amqpTransport("amqp://localhost:5672");
var muon = muonCore.muon('tck', amqp.getDiscovery(), [
    ["my-tag", "tck-service", "node-service"]
]);
muon.addTransport(amqp);

var queueEvents = [];

setTimeout(function() {
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

    muon.resource.onQuery("/discover", "Get the events", function(event, data, respond) {
        muon.discoverServices(function(services) {
            logger.info('Discovery called');
            respond(_.collect(services, function(it) {
                return it.identifier;
            }));
        });
    });

    muon.resource.onQuery("/event", "Get the events", function(event, data, respond) {
        respond(events);
    });

    muon.resource.onCommand("/echo", "Allow post of some data", function(event, data, respond) {
        respond({
            "something":"awesome",
            "method":"POST"
        });
    });

    var requestStore = {};

    muon.resource.onQuery("/invokeresponse", "hh", function(event, data, respond) {

        muon.resource.get(data.resource, function(event, payload) {
            logger.info("We have a GET response");
            console.dir(payload);
            requestStore = payload;
            respond(payload);
        });
    });

    muon.resource.onQuery("/invokeresponse-store", "hh", function(event, data, respond) {
        logger.info("invokeresponse-store has been requested");
        respond(requestStore);
    });

}, 500);


logger.info("Starting Muon Node TCK");









