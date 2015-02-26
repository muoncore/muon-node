var muonCore = require("./index.js");
var muon = muonCore.muon('httpserv');
//muon.addTransport(muonCore.httpTransport);

muon.addTransport(muonCore.httpTransport());

muon.onGet("/home", "A GET request", function(event, data, respond) {
    console.log('got a message');
    respond({"test": "a test"});
});