

module.exports = function(url) {
    this.amqp = require('amqp');
    this.url = url;
    this.implOpts = {
        defaultExchangeName: '',
        reconnect: true,
        reconnectBackoffStrategy: 'linear',
        reconnectBackoffTime: 500 // ms
    };

    this.connect = function (callback) {
        var connection = this.amqp.createConnection({url: this.url}, this.implOpts);
        connection.on('error', function (msg) {
            console.log("Getting an error");
            console.dir(msg);
        });
        connection.on("ready", callback);

        this.connection = connection;
    };

    this.queue = function (name, params, callback) {
        this.connection.queue(name, params, callback);
    };

    this.exchange = function (name, callback, params) {
        if (typeof params === 'undefined') {
            params = {
                durable: false,
                type: "direct",
                autoDelete: true,
                confirm: true
            };
        }
        if (typeof name === 'undefined' || name.length == 0) name = '';

        console.log('Setting up new exchange at ' + name);
        var exch = this.connection.exchange(name, params);
        if (typeof callback === 'function') {
            callback(exch);
        }
        return exch;
    };

    this.send = function (qObj, event, callback) {
        var queue, route;

        if (typeof qObj === 'object') {

            queue = qObj.queue;
            route = queue;

            if ('route' in qObj) route = qObj.route;

        } else {
            queue = route = qObj;
        }

        if (typeof event === 'object') {
            if (!'payload' in event) {
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

        if ('options' in event) {

        }

        if ('headers' in event) options.headers = event.headers;


        this.connection.on('ready', function () {
            console.log('Connection is ready to send on ' + queue);

            var con = this.connection;

            con.publish(route, event.payload, options, function (test) {

                if (typeof callback === 'function') {
                    callback();
                }

            });
        });
    };

    this.listen = function (qObj, callback) {
        var queue, route, replyTo;

        if (typeof qObj === 'object') {

            queue = qObj.queue;
            route = queue;

            if ('route' in qObj) route = qObj.route;

        } else {
            queue = route = qObj;
        }

        var waitInterval = setInterval(function () {
            if (typeof this.resourceExchange == 'object') {
                clearInterval(waitInterval);

                console.log("Creating listening queue " + queue);

                var resqueue = this.connection.queue(queue, {
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
                            }, message.data, function (response) {
                                if ('replyTo' in messageObject) {
                                    var replyTo = messageObject.replyTo;
                                    console.log('MessageObb=ject contains replyto: ' + replyTo);

                                    this.connection.publish(replyTo, JSON.stringify(response), {
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
    }
};