var assert = require('assert');
var url = require('url');
var request = require("superagent");

var _ = require('underscore');
var mockDockerApi = require("./mockDockerApi.js");


var testFile = 'testControlPlane.js';

var testLog = testFile + '';

var mockDockerPort = process.env.SP_DOCKER_PORT || 14321;

var testService = 'control-plane';

var plane;

describe("Control Plane reacting to nucleus notifications", function() {

    beforeEach(function(){


//        plane = require("../plane.js");
//
//        plane.connect();
    });

//    afterEach(function() {
//        console.log("Closing down for awesome!");
//        nucleus.shutdown();
//    });

    it ("PUT to /container/XX/gene", function(done) {
        this.timeout(3500);
        var nucleus = require("./muon-test.js");
        nucleus.listen(7777);
        nucleus.onResourceQuery({}, [
            { recordId:"gns", inspection: { NetworkSettings: { IPAddress:"111.111.111.111" }}},
            { recordId:"mymodule", inspection: { NetworkSettings: { IPAddress:"111.111.111.111" }}},
            { recordId:"simples", inspection: { NetworkSettings: { IPAddress:"111.111.111.111" }}},
            { recordId:"proxy", inspection: { NetworkSettings: { IPAddress:"111.111.111.88" }}},
        ]);

        var plane = require("../plane.js");

        plane.connect("http://localhost:7777");

        function exec() {
            //TODO, the standard containers ...

            //expect a response message of the correct form, including data from the docker api.

            nucleus.on(function (event) {
                assert.equal(event.resource, "container");
                assert.equal(event.action, "put");
                assert.equal(event.type, "runtime");
                assert.equal(event.recordId, "simplenode");
                console.dir(event.payload);
                //    payload:actions[6]
                plane.muon.shutdown();
                nucleus.shutdown();
                done()
            });

            //tell mock nucleus to emit a PUT.
            nucleus.send({
                resource: "container",
                type: "gene",
                recordId:"simplenode",
                action: "put",
                payload: {
                    "id": "simplenode",
                    "image": "sp_platform/uber-any",
                    "env": {
                        "GIT_REPO_URL": "https://github.com/fuzzy-logic/simplenode.git",
                        "DNSHOST": "simplenode.muon.cistechfutures.net"
                    }
                }
            });
        }
        //quite crappy. can't quite get to the low level stuff needed to properly event this.
        setTimeout(exec, 100);
    });  /*
    it ("POST to /container/XX/gene", function(done) {
        this.timeout(500);
        nucleus.shutdown();
    });     */
    /*it ("DELETE to /container/xx/gene", function(done) {
        this.timeout(3500);
        var nucleus = require("./muon-test.js");
        nucleus.listen(7778);
        var plane = require("../plane.js");

        plane.connect("http://localhost:7778");

        function exec() {
            //TODO, the standard containers ...
            nucleus.onResourceQuery({}, []);

            //expect a response message of the correct form, including data from the docker api.
            nucleus.on(function (event) {
                assert.equal(event.resource, "container");
                assert.equal(event.action, "deleted");
                assert.equal(event.recordId, "simplenode");
                console.log("Got a message ..");
                console.dir(event);
                //    payload:actions[6]
                plane.muon.shutdown();
                nucleus.shutdown();
                done()
            });

            //tell mock nucleus to emit a delete.
            nucleus.send({
                resource: "container",
                type: "gene",
                recordId:"simplenode",
                action: "delete"
            });
        }
        //quite crappy. can't quite get to the low level stuff needed to properly event this.
        setTimeout(exec, 100);
    });*/
});
