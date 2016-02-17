var muoncore = require('../../muon/api/muoncore.js');
var assert = require('assert');

var muon;
var muon2;

describe("Muon core test", function () {


    this.timeout(7000);

    var transportUrl = "amqp://muon:microservices@localhost";
    var discoveryUrl = transportUrl;
    var config = {};

    before(function () {
        muon = muoncore.create("example-service", config, discoveryUrl, transportUrl);
        muon.handle('muon://example-service/tennis', function (event, respond) {
            logger.info('*****   muoncore-test.js *************************************************');
            logger.debug('muon://service/tennis server responding to event.id' + event.headers.id);
            event.payload.message = "pong";
            respond(event);
        });
    });

    after(function() {
       muon.shutdown();
       muon2.shutdown();
    });

    it("create request protocol stack", function (done) {


        var event = {
            headers: {
                eventType: "RequestMade",
                id: "ABCDEFGH",
                targetService: "example-service",
                sourceService: "example-client",
                protocol: "request",
                url: "muon://example-service/tennis",
                "Content-Type": "application/json",
                sourceAvailableContentTypes: ["application/json"],
                channelOperation: "NORMAL"
            },
            payload: {
                message: "ping"
            }
        };
        muon2 = muoncore.create("example-service", config, discoveryUrl, transportUrl);

        setTimeout(function () {

            var promise = muon2.request('muon://example-service/tennis', event);

            promise.then(function (event) {
                logger.info("muon://example-client server response received! event.id=" + event.id);
                logger.info("muon promise.then() asserting response...");
                assert(event, "request event is undefined");
                assert.equal(event.payload.message, "pong", "expected 'pong' response message from muon://example-service/tennis")
                done();
            }, function (err) {
                logger.error("muon promise.then() error!!!!!");
                throw new Error('error in promise');
            });

        }, 1000);

    });
});




