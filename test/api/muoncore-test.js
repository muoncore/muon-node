var muoncore = require('../../muon/api/muoncore.js');
var assert = require('assert');
var expect = require('expect.js');

var muon;
var muon2;

describe("Muon core test:", function () {


    this.timeout(30000);
    var serviceName = "example-service";
    var amqpurl = "amqp://muon:microservices@localhost";


    before(function () {

    });

    after(function() {
       if (muon) muon.shutdown();
       if (muon2) muon2.shutdown();
    });

    it("full stack request/response for rpc message", function (done) {


        muon = muoncore.create(serviceName, amqpurl);
        muon.handle('muon://example-service/tennis', function (event, respond) {
            logger.warn('*****  muon://service/tennis: muoncore-test.js *************************************************');
            logger.warn('muon://service/tennis server responding to event=' + JSON.stringify(event));
            respond("pong");
        });

        muon2 = muoncore.create("example-client", amqpurl);

        var promise = muon2.request('muon://example-service/tennis', "ping");

        promise.then(function (response) {
            logger.warn("muon://example-client server response received! response=" + JSON.stringify(response));
            logger.warn("muon promise.then() asserting response...");
            logger.info("Response is " + JSON.stringify(response))
            assert(response, "request response is undefined");
            assert.equal(response.body, "pong", "expected 'pong' but was " + response.body)
            done();
        }, function (err) {
            logger.error("muon promise.then() error!\n" + err.stack);
            done(err);
        }).catch(function(error) {
            logger.error("muoncore-test.js promise.then() error!:\n" + error.stack);
            done(error);

        });


    });




    it("rpc returns 404 message for invalid resource", function (done) {


        muon = muoncore.create(serviceName, amqpurl);
        muon.handle('muon://example-service/tennis', function (event, respond) {
            logger.warn('*****  muon://service/tennis: muoncore-test.js *************************************************');
            logger.warn('muon://service/tennis server responding to event.id=' + event.id);
            respond("pong");
        });

        muon2 = muoncore.create("example-client", amqpurl);

        var promise = muon2.request('muon://example-service/blah', "ping");

        promise.then(function (event) {
            logger.warn("muon://example-client server response received! event.id=" + event.id);
            logger.warn("muon://example-client server response received! event=" + JSON.stringify(event));
            logger.warn("muon promise.then() asserting response...");
            assert(event, "request event is undefined");
            assert.equal(event.status, "404", "expected '404' response message from muon://example-service/blah");

            if (event.status === '404') {
                done();
            } else {
                done(new Error('expected 404'));
            }

        }, function (err) {
            logger.error("muon promise.then() error!!!!!");
            done(err);
        }).catch(function(error) {
            logger.error("muoncore-test.js promise.then() error!!!!!: " + error);
            done(err);

        });
    });





    it("transport returns failure message for invalid server name", function (done) {

        muon = muoncore.create("example-client", amqpurl);



        var promise = muon.request('muon://invalid-service/blah', "ping");

        promise.then(function (event) {
            logger.warn("muon://example-client server response received! event.id=" + event.id);
            logger.warn("muon://example-client server response received! event=" + JSON.stringify(event));
            logger.warn("muon promise.then() asserting response...");
            assert(event, "request event is undefined");
            assert.equal(event.status, "noserver", "expected 'noserver' response message from muon://invalid-service/blah");

            if (event.status === 'noserver') {
                done();
            } else {
                done(new Error('expected noserver error'));
            }

        }, function (err) {
            logger.error("muon promise.then() error!!!!!");
            done(err);
        }).catch(function(error) {
            logger.error(error);
            done(error);

        });
    });


    it("rpc returns timeout message for non replying resource", function (done) {


        muon = muoncore.create(serviceName, amqpurl);
        muon.handle('muon://example-service/tennis', function (event, respond) {
            logger.warn('*****  muon://service/tennis: muoncore-test.js *************************************************');
            logger.warn('muon://service/tennis server not responding');
            //respond("pong");
        });

        muon2 = muoncore.create("example-client", amqpurl);

        var promise = muon2.request('muon://example-service/tennis', "ping");

        promise.then(function (event) {
            logger.warn("muon://example-client server response received! event.id=" + event.id);
            logger.warn("muon://example-client server response received! event=" + JSON.stringify(event));
            logger.warn("muon promise.then() asserting response...");
            assert(event, "request event is undefined");
            assert.equal(event.error.status, "timeout", "expected 'timeout' message from calling muon://example-service/tennis");

            if (event.error.status === 'timeout') {
                done();
            } else {
                done(new Error('timeout exceeded'));
            }

        }, function (err) {
            logger.error(err);
            done(err);
        }).catch(function(error) {
            logger.error(error);
            done(error);

        });
    });




    it("handles missing transport component error graefully", function () {

         expect(function() {
            muoncore.create(serviceName, 'http://blah/blah/blah', amqpurl)
          }).to.throwException(/unable to find transport component for url/);

    });


        it("handles missing discovery component error graefully", function () {

              expect(function() {
                 muoncore.create(serviceName, amqpurl, 'http://blah/blah/blah')
               }).to.throwException(/unable to find discovery component for url/);

        });


});
