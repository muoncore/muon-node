
var muon = require("./muon/muon-core.js")("tck");

var events = [];

//muon.onBroadcast("tckBroadcast", function(event) {
//    console.log("Got a myevent");
//    console.dir(event);
//    events.push(event);
//});

muon.onGet("/event", "Get the events", function(event) {
    return events;
});

muon.onGet("/echo", "Allow get of some data", function(event) {
    return {
        "something":"awesome",
        "method":"GET"
    }
});

muon.onPost("/echo", "Allow post of some data", function(event, payload) {
    return {
        "something":"awesome",
        "method":"POST"
    }
});

muon.onDelete("/echo", "Allow delete of some data", function(event) {
    return {
        "something":"awesome",
        "method":"DELETE"
    }
});

muon.onPut("/echo", "Allow put of some data", function(event, payload) {
    return {
        "something":"awesome",
        "method":"PUT"
    }
});


console.log("Starting Muon Node TCK");









