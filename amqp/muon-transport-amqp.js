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
        console.log("Ready!");
    });

    return {

        exch: {},

        setServiceIdentifier: function(serviceIdentifier) {
            _this.serviceIdentifier = serviceIdentifier;
        },

        emit: function(event) {

        },
        listenOnBroadcast: function(event, callback) {

        },

        queue: {
            send: function(queueName, event) {
                _this.queues.send(queueName, event);
            },
            listen: function(queueName, callback) {
                _this.queues.listen(queueName, callback);
            }
        },

        sendAndWaitForReply: function(event, callback) {
            //get the url elements

            console.log('Sending something through amqp on ' + event.url);

            var u = url.parse(event.url, true);

            u.path.replace(/^\/|\/$/g, '');

            var queue = u.hostname + "." + u.path + "." + event.method;
            //var queue = "muon-node-send-" + uuid.v1();
            var replyQueue = queue + ".reply";

            _this.queues.listen(replyQueue, callback);
            _this.queues.send(queue, event);
        },

        listenOnResource: function(resource, method, callback) {
            resource = resource.replace(/^\/|\/$/g, '');

            var key = _this.serviceIdentifier + "." + resource + "." + method;

            console.log('Listening for ' + resource + ' on ' + key);

            _this.queues.listen(key, callback);
        }
    };
};