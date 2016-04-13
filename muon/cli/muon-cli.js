#!/usr/bin/env node

var cli = require('cli').enable('status');


var amqpUrl = process.env.MUON_URL;


cli.parse({
    discover:   ['d', 'discover muon services', 'string'],
    rpc:  ['rpc', 'remote procedure call url', 'string'],
    port: ['s', 'Serve static files from PATH', 'number', '8080']
});
 
cli.main(function(args, options) {

 
    this.ok('muon running...');
 
    this.ok('options: ' + JSON.stringify(options));
 
    this.ok('discover options: ' + options.discover);
});