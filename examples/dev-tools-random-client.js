var muoncore = require('../muon/api/muoncore.js');
var assert = require('assert');
var expect = require('expect.js');

//
var amqpurl = "amqp://muon:microservices@localhost";


logger.info('starting muon...');
muon = muoncore.create("nodejs-client", amqpurl);
// or request://photon/projection-keys
var pingPromise = muon.request('request://muon-dev-tools/random', "");

pingPromise.then(function (event) {
    logger.warn('*****************************************************************************************');
    logger.warn("dev-tools-client server response received! event=" + JSON.stringify(event));
    logger.warn("dev-tools-client server response received! payload=" + JSON.stringify(event.payload));
    assert.ok(event.payload > 10000);
    assert.ok(event.payload < 99999);
    process.exit(0);
}, function (err) {
    logger.error("dev-tools-client muon promise.then() error!!!!!");
        process.exit(0);
}).catch(function(error) {
    logger.error("dev-tools-client promise.then() error!!!!!: \n" + error.stack);
    process.exit(0);
});





