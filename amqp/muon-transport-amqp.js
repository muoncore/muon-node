var util = require('util');

var _this = this;

var uuid = require('node-uuid');
var url = require('url');


module.exports = function amqpTransport(url) {

    var _this = this;

    _this.connection = require('./amqp-connection.js')(url);

    _this.connection.connect(function() {
        _this.broadcast = require('./amqp-broadcast.js')(_this.connection);
        _this.queues    = require('./amqp-queues.js')(_this.connection);
        _this.resources = require('./amqp-resources.js')(_this.queues);
        var waitInterval = setInterval(function() {
            console.log("Checking " + _this.serviceIdentifier);
            if (typeof _this.serviceIdentifier !== 'undefined') {
                clearInterval(waitInterval);
                console.dir(_this.serviceIdentifier);
                _this.resources.setServiceIdentifier(_this.serviceIdentifier);
            }
        }, 10);
        console.log("Ready!");
    });

    return {

        exch: {},

        setServiceIdentifier: function(serviceIdentifier) {
            _this.serviceIdentifier = serviceIdentifier;
        },

        broadcast: {
            emit: function (event) {
                _this.broadcast.emit(event);
            },
            listenOnBroadcast: function (event, callback) {
                _this.broadcast.listenOnBroadcast(event, callback);
            }
        },

        queue: {
            send: function(queueName, event) {
                _this.queues.send(queueName, event);
            },
            listen: function(queueName, callback) {
                _this.queues.listen(queueName, callback);
            }
        },

        resource: {
            sendAndWaitForReply: function (event, callback) {
                _this.resources.sendAndWaitForReply(event, callback);
            },

            listenOnResource: function (resource, method, callback) {
                _this.resources.listenOnResource(resource, method, callback);
            }
        }
    };
};