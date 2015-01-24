var muonCore = require('./index.js');
var muon = muonCore.muon('tck');
muon.addTransport(muonCore.amqpTransport());

muon.post("muon://tck/echo", {"Now": "Then"}, function(response) {
    //console.log("response " + response);
    //console.dir(response);
    console.dir(JSON.parse(response.payload.toString()));
    process.exit();
});
