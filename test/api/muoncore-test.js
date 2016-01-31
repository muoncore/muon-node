var muoncore = require('../../muon/api/muoncore.js');
var assert = require('assert');

var muon;


describe("Muon core test", function () {

    this.timeout(4000);

      before(function() {
            var muon = muoncore.create();
            muon.handle('muon://ExampleService/shop', function(event, respond){
                logger.debug('muon://ExampleService/shop server responding to event.id' + event.id);
                respond(event);
                done();
            });
      });

    it("create request protocol stack", function (done) {

        var transportUrl = "amqp://muon:microservices@localhost";
        var discoveryUrl = transportUrl;
        var config = {};
        var event = {
            id: "ABC123-890XYZ",
            headers:{
                eventType:"RequestMade",
                id:"simples",
                targetService:"ExampleService",
                sourceService:"ExampleService",
                protocol:"request",
                url:"/",
                "Content-Type":"application/json",
                sourceAvailableContentTypes:["application/json"],
                channelOperation:"NORMAL"
            },
            payload:{
                be:"happy"
        }};
        var muon = muoncore.create("ExampleService", config, discoveryUrl, transportUrl);
        setTimeout(function() {

            var promise = muon.request('muon://ExampleService/shop', event);
            promise.then(function(event) {
                  logger.info("muon promise.then() asserting response...");
                  assert(response);
                  done();
            });


        }, 2500);

    });
});




