var muoncore = require('../../muon/api/muoncore.js');
var assert = require('assert');

var muon;
var muon2;

describe("Muon core test", function () {


    this.timeout(7000);

    var amqpurl = "amqp://muon:microservices@localhost";
    var config = {
        discovery:{
            type:"amqp",
            url:amqpurl
        },
        transport:{
            type:"amqp",
            url:amqpurl
        }
    };

    before(function () {
        muon = muoncore.create("example-service", config);
        muon.handle('muon://example-service/tennis', function (event, respond) {
            logger.info('*****  muon://service/tennis: muoncore-test.js *************************************************');
            logger.debug('muon://service/tennis server responding to event.id=' + event.id);
            respond("pong");
        });
    });

    after(function() {
       muon.shutdown();
       muon2.shutdown();
    });

    it("create request protocol stack", function (done) {

        muon2 = muoncore.create("example-client", config);

        setTimeout(function () {

            var promise = muon2.request('muon://example-service/tennis', "ping");

            promise.then(function (event) {
                logger.info("muon://example-client server response received! event.id=" + event.id);
                logger.info("muon://example-client server response received! event=" + JSON.stringify(event));
                logger.info("muon promise.then() asserting response...");
                assert(event, "request event is undefined");
                assert.equal(event.payload, "pong", "expected 'pong' response message from muon://example-service/tennis")
                done();
            }, function (err) {
                logger.error("muon promise.then() error!!!!!");
                throw new Error('error in return muon promise');
            }).catch(function(error) {
                logger.error("muoncore-test.js promise.then() error!!!!!: " + error);
                throw new Error('error in return muon promise in muoncore-test.js', error);

            });

        }, 1500);

    });
});




