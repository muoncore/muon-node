var muoncore = require('../../muon/api/muoncore.js');
var assert = require('assert');


describe("Muon core test", function () {

    this.timeout(4000);


      after(function() {
            //bi-channel.closeAll();
      });

    it("cerate request callback stack", function (done) {


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

            muon.request('muon://ExampleService/', event, function(response) {
                        assert(response);
                        done();
                    });


        }, 1000);




    });
});




