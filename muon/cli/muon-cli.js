#!/usr/bin/env node

var cli = require('cli').enable('status');
require('sexylog');
var url = require('url');
var Joi = require('joi');




var amqpUrl = process.env.MUON_URL;


cli.parse({
    discover:   ['d', 'discover muon services'],
    rpc:  ['rpc', 'remote procedure call url', 'string'],
    stream: ['s', 'print events from stream', 'string']
});
 
cli.main(function(args, options) {

    var validAmqpUrl =  Joi.validate(amqpUrl,  Joi.string().uri().required());

    if (validAmqpUrl.error) {
        logger.error('amqp env variable url invalid! MUON_URL=' + amqpUrl);
        exit();
    }
    this.ok('muon cli connected: ' + amqpUrl);
 
    this.ok('options: ' + JSON.stringify(options));

    if (options.discover) {
        discover();
    }

});


function discover() {

    var AmqpDiscovery = require("../../muon/discovery/amqp/amqp-discovery");
    var discovery = new AmqpDiscovery(amqpUrl);

    setTimeout(function() {
            discovery.discoverServices(function(services) {
                    console.log('services: ' + JSON.stringify(services));
                    exit();
             });
    }, 5000)


}

var validate = function(err, value) {
    logger.info(err);


    if (err) {
        logger.error(value);
        exit();
    }
}

function exit() {
    process.exit(0);
}