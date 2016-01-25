
require("sexylog");
var AmqpDiscovery = require("./muon/discovery/amqp/amqp-discovery.js");


var discovery = new AmqpDiscovery("amqp://muon:microservices@localhost");
discovery.advertiseLocalService({
    identifier:"awesome",
    tags:["node", "awesome"]
});