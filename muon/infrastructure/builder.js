var ServerStacks = require("../../muon/api/server-stacks");
var url = require("url");

module.exports.build = function(config) {

    var serverStacks = new ServerStacks(config.serviceName);

    var infrastructure = {
        config: config,
        discovery: '',
        transport: '',
        serverStacks: serverStacks,
        shutdown: function() {
            //shutdown stuff...
        }
    }


    try {
      var AmqpDiscovery = require('../../muon/discovery/' + config.discoveryProtocol() + '/discovery.js');
      infrastructure.discovery = new AmqpDiscovery(config.discovery_url);
    } catch (err) {
      logger.error('unable to find discovery component for url: ""' + config.discovery_url + '""');
      logger.error(err.stack);
      throw new Error('unable to find discovery component for url: ""' + config.discovery_url + '""');
    }

    try {
      var amqpTransport = require('../../muon/transport/' + config.transportProtocol() + '/transport.js');
      var serviceName = infrastructure.config.serviceName;
      var transportUrl = infrastructure.config.transport_url;
      infrastructure.transport = amqpTransport.create(serviceName, transportUrl, serverStacks, infrastructure.discovery);
    } catch (err) {
      logger.error('unable to find transport component for url: ""' + config.transport_url + '""');
      logger.error(err.stack);
      throw new Error('unable to find transport component for url: ""' + config.transport_url + '""');
    }




    return infrastructure;
}

module.exports.config = function(serviceName, transportUrl, discoveryUrl) {
  if (! discoveryUrl) discoveryUrl = transportUrl;
  var config = {
      serviceName: serviceName,
      discovery_url: discoveryUrl,
      transport_url: transportUrl,
      transportProtocol: function() {
          return url.parse(transportUrl).protocol.split(':')[0];
      },
      discoveryProtocol: function() {
        return url.parse(discoveryUrl).protocol.split(':')[0];
      }
    };
    return config;
}
