var muoncore = require('../muon/api/muoncore.js');
var assert = require('assert');
var expect = require('expect.js');

//
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

logger.info('starting muon...');
muon = muoncore.create("nodejs-client", config);
// or request://photon/projection-keys
var pingPromise = muon.request('request://muon-dev-tools/ping', "ping");

pingPromise.then(function (event) {
    logger.info('*****************************************************************************************');
    logger.info("dev-tools-client server response received! event=" + JSON.stringify(event));
    logger.info("dev-tools-client server response received! payload=" + JSON.stringify(payload));
    assert.equal('pong', event.payload);
    process.exit(0);
}, function (err) {
    logger.error("dev-tools-client muon promise.then() error!!!!!");
    throw new Error('dev-tools-client error in return muon promise');
}).catch(function(error) {
    logger.error("dev-tools-client promise.then() error!!!!!: " + error);
    throw new Error('dev-tools-client error in return muon promise in dev-tools-client.js', error);
    process.exit(0);
});





