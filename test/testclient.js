
require("sexylog")

var Muon = require("../muon/api/muoncore");

var muon = Muon.create("my-tester", process.env.MUON_URL || "amqp://muon:microservices@localhost");

muon.infrastructure().getTransport().then(function(transport) {
    // var internalChannel = transport.openChannel("awesomeservicequery", "rpc");
    setInterval(function() {
        // var internalChannel2 = transport.openChannel("awesomeservicequery", "rpc");
        muon.request("rpc://back-end/board/list", {"message": "BE AWESOME"}, function(resp) {
            logger.info("GOT RPC DATA - " + JSON.stringify(resp))
        });

    }, 200)
})
    