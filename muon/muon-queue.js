module.exports = function(opts) {

    var _this = this;

    var amqp = require('amqp');
    var uuid = require('node-uuid');
    var url = require('url');

    var amqpurl = "amqp://localhost";

    var implOpts = {
        defaultExchangeName: '',
        reconnect: true,
        reconnectBackoffStrategy: 'linear',
        reconnectBackoffTime: 500 // ms
    };

    this.connection =  amqp.createConnection({ url: amqpurl }, implOpts);

    this.connection.on('error', function (msg) {
        console.log("Getting an error");
        console.dir(msg);
    });

    var scope = {

        connect: function(url, opts) {

            this.connection = _this.connection;

        },

        exchange: function(name) {

            if(typeof name === 'undefined' || name.length == 0) name = '';

            console.log('Setting up new exchange at ' + name);



            _this.connection.on('ready', function() {
                //console.log('An exchange has been created at ' + name);
                _this.resourceExchange = _this.connection.exchange(name, {
                    durable:false,
                    type: 'direct',
                    autoDelete:false,
                    confirm: true
                });
            });
        },

        send: function(qObj, event, callback) {
            var queue, route;

            if(typeof qObj === 'object') {

                queue = qObj.queue;
                route = queue;

                if ('route' in qObj) route = qObj.route;

            } else {
                queue = route = qObj;
            }

            if(typeof event === 'object') {
                if(!'payload' in event) {
                    // we should throw an error here? For now we fail silently
                    event.payload = '';
                }

            } else {
                event = {
                    payload: event
                };
            }

            console.dir(event);

            console.log('sending on queue ' + route);

            var options = {
                replyTo: route + '.reply',
                contentType: "text/plain"
            };

            if('options' in event) {

            }

            if('headers' in event) options.headers = event.headers;


            _this.connection.on('ready', function() {
                console.log('Connection is ready to send on ' + queue);

                var con = _this.connection;

                con.publish(route, event.payload, options, function(test) {

                    if(typeof callback === 'function') {
                        callback();
                    }

                });
            });
        },

        listen: function(qObj, callback) {
            var queue, route, replyTo;

            if(typeof qObj === 'object') {

                queue = qObj.queue;
                route = queue;

                if ('route' in qObj) route = qObj.route;

            } else {
                queue = route = qObj;
            }

            var waitInterval = setInterval(function() {
                if (typeof _this.resourceExchange == 'object') {
                    clearInterval(waitInterval);

                    console.log("Creating listening queue " + queue);

                    var resqueue = _this.connection.queue(queue, {
                        durable: false,
                        exclusive: false,
                        ack: true,
                        autoDelete: true
                    }, function (q) {

                        q.bind(queue, function () {
                            console.log("Bound queue " + queue + " to route " + route);
                            q.subscribe(function (message, headers, deliveryInfo, messageObject) {

                                console.log("Got a message");
                                //console.dir(messageObject);
                                callback({
                                    payload: message.data
                                }, message.data, function(response) {
                                    if('replyTo' in messageObject) {
                                        var replyTo = messageObject.replyTo;
                                        console.log('MessageObb=ject contains replyto: ' + replyTo);

                                        _this.connection.publish(replyTo, JSON.stringify(response), {
                                            "contentType": "text/plain"
                                        });
                                    } else {
                                        console.log('No replyTo');
                                    }
                                });
                            });
                        });
                    });
                }
            });
        },

        close: function() {

        }
    };



    return scope;
};