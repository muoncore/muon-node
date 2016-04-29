var muoncore = require('../muon/api/muoncore.js');


//
var amqpurl = "amqp://tfadmin:techfutu13@msg.cistechfutures.net";
//var amqpurl = 'amqp://guest:guest@conciens.mooo.com';



logger.info('starting muon...');
muon = muoncore.create("test-photon-client", amqpurl);
// or request://photon/projection-keys
var promise = muon.request('request://photon/projection-keys', {msg: 'hi!'});

promise.then(function (event) {
    logger.info('*****************************************************************************************');
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
