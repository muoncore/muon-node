var muonCore = require('./index.js');
var muon = muonCore.muon('tck');
//muon.addTransport(muonCore.amqpTransport());

var mQ = muon.queue();

mQ.listen('tck./echo.post.reply', function(response) {
    console.dir(JSON.parse(response.payload.toString()));
    process.exit();
});

mQ.send('tck./echo.post', {payload: {event: "a thing"}});

/*
muon.post("muon://tck/echo", {"Now": "Then"}, function(response) {
    //console.log("response " + response);
    //console.dir(response);
    console.dir(JSON.parse(response.payload.toString()));
    process.exit();
});
*/