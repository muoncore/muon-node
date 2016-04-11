var muoncore = require('../../muon/api/muoncore.js');
var assert = require('assert');

var muon;
var muon2;

describe("Muon core test", function () {


    this.timeout(30000);
    var serviceName = "example-service";
    var amqpurl = "amqp://muon:microservices@localhost";


    before(function () {

    });

    after(function() {
       muon.shutdown();
       muon2.shutdown();
    });

    it("full stack send reply to rpc message", function (done) {


        muon = muoncore.create(serviceName, amqpurl);
        muon.handle('muon://example-service/tennis', function (event, respond) {
            logger.info('*****  muon://service/tennis: muoncore-test.js *************************************************');
            logger.debug('muon://service/tennis server responding to event.id=' + event.id);
            respond("pong");
        });

        muon2 = muoncore.create("example-client", amqpurl);

        setTimeout(function () {

            var promise = muon2.request('muon://example-service/tennis', "ping");

            promise.then(function (event) {
                logger.warn("muon://example-client server response received! event.id=" + event.id);
                logger.warn("muon://example-client server response received! event=" + JSON.stringify(event));
                logger.warn("muon promise.then() asserting response...");
                assert(event, "request event is undefined");
                assert.equal(event.payload, "pong", "expected 'pong' response message from muon://example-service/tennis")
                done();
            }, function (err) {
                logger.warn("muon promise.then() error!!!!!");
                throw new Error('error in return muon promise');
            }).catch(function(error) {
                logger.warn("muoncore-test.js promise.then() error!!!!!: " + error);
                throw new Error('error in return muon promise in muoncore-test.js', error);

            });

        }, 1500);

    });

    it("rpc returns 404 message for invaid resource", function (done) {


        muon = muoncore.create(serviceName, amqpurl);
        muon.handle('muon://example-service/tennis', function (event, respond) {
            logger.info('*****  muon://service/tennis: muoncore-test.js *************************************************');
            logger.debug('muon://service/tennis server responding to event.id=' + event.id);
            respond("pong");
        });

        muon2 = muoncore.create("example-client", amqpurl);

        setTimeout(function () {

            var promise = muon2.request('muon://example-service/blah', "ping");

            promise.then(function (event) {
                logger.warn("muon://example-client server response received! event.id=" + event.id);
                logger.warn("muon://example-client server response received! event=" + JSON.stringify(event));
                logger.warn("muon promise.then() asserting response...");
                assert(event, "request event is undefined");
                assert.equal(event.payload.status, "404", "expected '404' response message from muon://example-service/blah");

                if (event.payload.status === '404') {
                    done();
                } else {
                    done(new Error('expected 404'));
                }

            }, function (err) {
                logger.warn("muon promise.then() error!!!!!");
                throw new Error('error in return muon promise');
                done(err);
            }).catch(function(error) {
                logger.warn("muoncore-test.js promise.then() error!!!!!: " + error);
                throw new Error('error in return muon promise in muoncore-test.js', error);
                done(err);

            });

        }, 1500);

    });
});




