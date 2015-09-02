var assert = require('assert');
var fs = require('fs');
//var expect = require('expect');




describe("Muon config test", function () {

    //this.timeout(7000);

    it("accepts zero config and uses sensible defaults", function (done) {
        var muonCore = require("../muon");
        var errThrown = false;
        try {
            muon = muonCore.generateMuon();
        } catch (err) {
            errThrown = true;
            assert(err);
        }
        assert(errThrown);
        done();

    });

    it("accepts transport URL to define config", function (done) {
        var muonCore = require("../muon");
        var amqpUrl = "amqp://muon:microservices@localhost";
        var serviceName = "muon-config-test";

        var muon = muonCore.generateMuon(serviceName, amqpUrl);
        assert(muon);
        done();

    });

    it("looks for default config file", function (done) {
        var muonCore = require("../muon");
        var file = "./muon.config";
        var config = {
                 "serviceName": "muon-test-config-file",
                 "tags" : [ "" ],
                 "discovery": {
                   "type": "amqp",
                   "url": "amqp://muon:microservices@localhost"
                 },
                 "transports": [
                   { "type":"amqp", "url": "amqp://muon:microservices@localhost" }
                 ]
        }

        // write config file, run muon, then delete config file:
        fs.writeFile(file, JSON.stringify(config), function(err) {
            if(err) {
                throw new Error('unable to write config file to disk');
            }
            var muon = muonCore.generateMuon();
            assert(muon);
            fs.unlinkSync(file);
            done();
        });



    });


});