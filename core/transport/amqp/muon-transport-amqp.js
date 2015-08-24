
var url = require('url');
var AmqpConnection = require('./amqp-connection.js');
var Broadcast = require('./amqp-broadcast.js');
var Queues = require('./amqp-queues.js');
var Resources = require('./amqp-resources.js');
var Streams = require('./amqp-stream.js');

var AmqpTransport = function (url) {

    var _this = this;

    _this.connection = new AmqpConnection(url);
    _this.url = url;

    _this.connection.connect(function () {
        _this.broadcast = new Broadcast(_this.connection);
        _this.queues = new Queues(_this.connection);
        _this.resources = new Resources(_this.queues);
        _this.streams = new Streams(_this.queues);
        var waitInterval = setInterval(function () {
            if (typeof _this.serviceIdentifier !== 'undefined') {
                clearInterval(waitInterval);
                _this.resources.setServiceIdentifier(_this.serviceIdentifier);
            }
        }, 10);
        logger.debug("AMQP Transport is ready");
    });
};

AmqpTransport.prototype.setServiceIdentifier = function (serviceIdentifier) {
    this.serviceIdentifier = serviceIdentifier;
};

AmqpTransport.prototype.getUrl = function () {
    return this.url;
};

AmqpTransport.prototype.emit = function (event) {
    this.broadcast.emit(event);
};
AmqpTransport.prototype.listenOnBroadcast = function (event, callback) {
    this.broadcast.listenOnBroadcast(event, callback);
};

AmqpTransport.prototype.sendAndWaitForReply = function (event, callback) {
    this.resources.sendAndWaitForReply(event, callback);
};

AmqpTransport.prototype.listenOnResource = function (resource, method, callback) {
    this.resources.listenOnResource(resource, method, callback);
};

AmqpTransport.prototype.subscribe = function (streamUri, dataCallback) {
    this.streams.subscribe(streamUri, dataCallback);
};

module.exports = AmqpTransport;
