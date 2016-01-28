var muoncore = require('../../muon/api/muoncore.js');
var assert = require('assert');


describe("Muon core test", function () {

    this.timeout(4000);


      after(function() {

      });

    it("create request protocol stack", function (done) {


        var event = {
            headers:{
                eventType:"RequestMade",
                id:"simples",
                targetService:"ExampleService",
                sourceService:"awesome",
                protocol:"request",
                url:"/",
                "Content-Type":"application/json",
                sourceAvailableContentTypes:["application/json"],
                channelOperation:"NORMAL"
            },
            payload:{
                be:"happy"
        }};
        var muon = muoncore.create();
        setTimeout(function() {

            var promise = muon.request('muon://ExampleService/', event);
            promise.then(function(event) {
                  logger.info("muon promise.then() asserting response...");
                  assert(response);
                  done();
            });


        }, 2500);

    });
});




