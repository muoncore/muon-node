var _ = require("underscore");
var bichannel = require('../../channel/bi-channel');

var AmqpQueue = require("amqp-queues");

var ServiceQueue = function (serviceName, connection) {
    this.serviceName = serviceName;
    this.connection = connection;
    this.queues = new AmqpQueue(this.connection);
};

ServiceQueue.prototype.onHandshake = function(callback) {

    //listen on queue.
    this.queues.listen("service." + this.serviceName, function(message) {
        logger.info("GOT DATA ON Service queue!!!");
        console.dir(message);
        callback()
    });
};

module.exports = ServiceQueue;
