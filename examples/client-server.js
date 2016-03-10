var muoncore = require('../muon/api/muoncore.js');


//
var amqpurl = "amqp://muon:microservices@localhost";
//var amqpurl = 'amqp://guest:guest@conciens.mooo.com';

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
var promise = muon.request('request://example-service/', "ping");

promise.then(function (event) {
    logger.info("nodejs-client response received! event.id=" + event.id);
    logger.info("nodejs-client response received! event=" + JSON.stringify(event));
    process.exit(0);
}, function (err) {
    logger.error("nodejs-client muon promise.then() error!!!!!");
    throw new Error('nodejs-client error in return muon promise');
}).catch(function(error) {
    logger.error("nodejs-client promise.then() error!!!!!: " + error);
    throw new Error('nodejs-client error in return muon promise in muoncore-test.js', error);
    process.exit(0);
});





