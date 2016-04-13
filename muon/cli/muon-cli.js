#!/usr/bin/env node

var cli = require('cli').enable('status');
require('sexylog');

var amqpUrl = process.env.MUON_URL;


cli.parse({
    discover:   ['d', 'discover muon services'],
    rpc:  ['rpc', 'remote procedure call url', 'string'],
    stream: ['s', 'print events from stream', 'string']
});
 
cli.main(function(args, options) {

 
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



function exit() {
    process.exit(0);
}