
var muon = require("./muon/muon-core.js");

muon.serviceIdentifer = "users";

// transports?
// extensions?

//muon.receive("something", function(event) {
//    console.log("Received data " + console.dir(event) );
//});


//muon.emit("email",
//    broadcast("Hello Everyone, this is my awesome email")
//        .withHeader("to", "david.dawson@simplicityitself.com")
//        .withHeader("from", "muon@simplicityitself.com")
//        .build());
//
//muon.resource("mydata", "Get Some Data", new MuonService.MuonGet() {
//    @Override
//    public Object onQuery(Object queryEvent) {
//        return "<h1> This is awesome!!</h1>";
//    }
//});


var data = muon.get("muon://users/mydata");

console.log("Starting Muon based service " + data);


