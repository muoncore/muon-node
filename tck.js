var muonCore = require("./index.js");
var muon = muonCore.muon('tck');

muon.addTransport(muonCore.amqpTransport());

var events = [];

/*

var mQ = muon.queue();

mQ.send('someGenericQ', {event: "a thing"});

*/



setInterval(function() {
    muon.broadcast("echoBroadcast", {reply: "test"}, {identifier: "Emitted Test"});
},3500);

muon.onBroadcast("echoBroadcast", function(event) {
    //console.log("Received the echo broadcast, responding with the same payload");
    //console.dir(JSON.parse(event.payload.toString()));
    muon.emit("echoBroadcastResponse", {}, JSON.parse(event.payload.toString()));
});

muon.onBroadcast("echoBroadcastResponse", function(event) {
    console.log("Received the response");
    //console.dir(JSON.parse(event.payload.toString()));
});

muon.onBroadcast("tckBroadcast", function(event) {
    console.log("Got an event " + event.payload.toString());
    var payload = JSON.parse(event.payload.toString());
    //console.dir(payload);
    events.push(payload);
});

muon.onGet("/discover", "Get the events", function(event, data, respond) {
    muon.discoverServices(function(services) {
        console.log('I was got');
        respond(services);
    });
});

muon.onGet("/event", "Get the events", function(event, data, respond) {
    respond(events);
});

muon.onDelete("/event", "Delete the events", function(event, data, respond) {
    events = [];
    respond({
    });
});

muon.onGet("/echo", "Allow get of some data", function(event, data, respond) {
    console.log('Echoing');
    respond({
        "something":"awesome",
        "method":"GET"
    });
});

muon.onPost("/echo", "Allow post of some data", function(event, data, respond) {
    console.log('I got a thing');
    console.dir(data);
    respond({
        "something":"awesome",
        "method":"POST"
    });
});

muon.onDelete("/echo", "Allow delete of some data", function(event, data, respond) {
    respond({
        "something":"awesome",
        "method":"DELETE"
    });
});

muon.onPut("/echo", "Allow put of some data", function(event, data, respond) {
    respond({
        "something":"awesome",
        "method":"PUT"
    });
});


console.log("Starting Muon Node TCK");









