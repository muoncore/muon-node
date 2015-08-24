var util = require('util');

var _this = this;

var uuid = require('node-uuid');
var url = require('url');
var AmqpConnection = require('./amqp-connection.js');
var Broadcast = require('./amqp-broadcast.js');
var Discovery = require("./muon-discovery-amqp.js");

module.exports = function amqpTransport(url) {

    var _this = this;

    _this.connection = new AmqpConnection(url);
    _this.url = url;

    _this.connection.connect(function() {
        _this.broadcast = new Broadcast(_this.connection);
        _this.queues    = require('./amqp-queues.js')(_this.connection);
        _this.resources = require('./amqp-resources.js')(_this.queues);
        _this.streams = require('./amqp-stream.js')(_this.queues);
        var waitInterval = setInterval(function() {
            if (typeof _this.serviceIdentifier !== 'undefined') {
                clearInterval(waitInterval);
                _this.resources.setServiceIdentifier(_this.serviceIdentifier);
            }
        }, 10);
        logger.debug("AMQP Transport is ready");
    });

    return {

        getDiscovery: function() {
            return new Discovery(url);
        },

        setServiceIdentifier: function(serviceIdentifier) {
            _this.serviceIdentifier = serviceIdentifier;
        },

        getUrl: function() {
            return _this.url;
        },

        broadcast: {
            emit: function (event) {
                _this.broadcast.emit(event);
            },
            listenOnBroadcast: function (event, callback) {
                _this.broadcast.listenOnBroadcast(event, callback);
            }
        },

        resource: {
            sendAndWaitForReply: function (event, callback) {
                _this.resources.sendAndWaitForReply(event, callback);
            },

            listenOnResource: function (resource, method, callback) {
                _this.resources.listenOnResource(resource, method, callback);
            }
        },

        stream: {
            provideStream: function(streamName, stream) {
                _this.streams.provideStream(streamName, stream);
            },
            subscribe: function(streamUri, dataCallback) {
                _this.streams.subscribe(streamUri, dataCallback);
            }
        }
    };
};
