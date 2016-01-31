var muoncore = require('../../muon/api/muoncore.js');
var assert = require('assert');

var muon;


describe("Muon core test", function () {



    this.timeout(7000);

     var transportUrl = "amqp://muon:microservices@localhost";
        var discoveryUrl = transportUrl;
        var config = {};

      before(function() {
            var muon = muoncore.create("ExampleService1", config, discoveryUrl, transportUrl);
            muon.handle('muon://ExampleService1/shop', function(event, respond){
                logger.info('*****   muoncore-test.js ************************************************************************');
                logger.debug('muon://ExampleService1/shop server responding to event.id' + event.headers.id);
                event.payload.message = "pong";
                respond(event);
            });
      });

    it("create request protocol stack", function (done) {


        var event = {
            headers:{
                eventType:"RequestMade",
                id:"ABCDEFGH",
                targetService:"ExampleService1",
                sourceService:"ExampleService2",
                protocol:"request",
                url:"muon://ExampleService1/shop",
                "Content-Type":"application/json",
                sourceAvailableContentTypes:["application/json"],
                channelOperation:"NORMAL"
            },
            payload:{
                message:"ping"
        }};
        var muon = muoncore.create("ExampleService2", config, discoveryUrl, transportUrl);

        setTimeout(function() {

            var promise = muon.request('muon://ExampleService2/shop', event);

                promise.then(function(event) {
                      logger.info("muon://ExampleService2/customer server response received! event.id=" + event.headers.id);
                      logger.info("muon promise.then() asserting response...");
                      assert(event);
                      done();
                }, function(err){
                         logger.error("muon promise.then() error!!!!!");
                         throw new Error('error in promise');
                });


        }, 1000);

    });
});




