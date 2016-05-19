var muoncore = require('../muon/api/muoncore.js');
var amqpurl = "amqp://muon:microservices@192.168.99.100";
var uuid = require('node-uuid');

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

logger.info('starting muon dev tools server...');
muon = muoncore.create("muon-dev-tools", amqpurl);



muon.handle('rpc://muon-dev-tools/ping', function (event, respond) {
    logger.debug('request://muon-dev-tools/ping responding to event.id=' + event.id);
    respond("pong");
});



muon.handle('rpc://muon-dev-tools/echo', function (event, respond) {
    logger.debug('request://muon-dev-tools/echo responding to event.id=' + event.id);
    respond(event.body);
});



muon.handle('rpc://muon-dev-tools/type', function (event, respond) {
    logger.debug('request://muon-dev-tools/type responding to event.id=' + event.id);
    respond(typeof event.body);
});



muon.handle('rpc://muon-dev-tools/random', function (event, respond) {
    logger.debug('request://muon-dev-tools/random responding to event.id=' + event.id);
    var max = 99999;
    var min = 10000;
    var randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    respond(randomNumber);
});



muon.handle('rpc://muon-dev-tools/uuid', function (event, respond) {
    logger.debug('request://muon-dev-tools/uuid responding to event.id=' + event.id);
    respond(uuid.v4());
});




muon.handle('rpc://muon-dev-tools/json', function (event, respond) {
    logger.debug('request://muon-dev-tools/json responding to event.id=' + event.id);
    respond({message: 'hello, world!', server_url: 'request://muon-dev-tools/json', echo: event.body});
});



muon.handle('rpc://muon-dev-tools/function', function (event, respond) {
    logger.debug('request://muon-dev-tools/function responding to event.id=' + event.id);
    var func = new Function(event.body);
    var result = func();
    respond(result);
});
