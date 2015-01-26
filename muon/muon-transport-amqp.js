

var amqp = require('amqp');
var uuid = require('node-uuid');
var url = require('url');

module.exports = exports = function amqpTransport() {

    var _this = this;

    var amqpurl = "amqp://localhost";

    var implOpts = {
        defaultExchangeName: '',
        reconnect: true,
        reconnectBackoffStrategy: 'linear',
        reconnectBackoffTime: 500 // ms
    };

    this.connection =  amqp.createConnection({ url: amqpurl }, implOpts);
    this.connection.on('ready', function() {

        _this.resourceExchange = _this.connection.exchange("", {
            durable:false,
            type: 'direct',
            autoDelete:false,
            confirm: true
        });

        _this.connection.exchange("muon-broadcast", {
            durable:false,
            autoDelete:false
        }, function(exch) {
            _this.broadcastExchange = exch;

            startAnnouncements();
        });
    });

    this.connection.on('error', function (msg) {
        console.log("Getting an error");
        console.dir(msg);
    });

    this.discoveredServiceList = [];
    this.discoveredServices = [];

    function startAnnouncements() {
        scope.listenOnBroadcast("serviceAnnounce", function(event) {
            var pay = JSON.parse(event.payload.toString());
            if(_this.discoveredServiceList.indexOf(pay.identifier) < 0) {
                _this.discoveredServiceList.push(pay.identifier);
                _this.discoveredServices.push(pay);
            }
        });

        scope.emit({
            name:"serviceAnnounce",
            payload:{
                identifier: _this.serviceIdentifier
            }
        });

        setInterval(function() {
            scope.emit({
                name:"serviceAnnounce",
                payload:{
                    identifier: _this.serviceIdentifier
                }
            });
        }, 3500);
    }


    var scope = {
        setServiceIdentifier: function(serviceIdentifier) {
            _this.serviceIdentifier = serviceIdentifier;
        },

        emit: function(event) {

            //console.log('Emitting event');
            var waitInterval = setInterval(function() {
                if (typeof _this.broadcastExchange == 'object') {
                    clearInterval(waitInterval);
                    var headers = {};
                    if (event.headers instanceof Object) {
                        headers = event.headers;
                    }

                    var options = {
                        headers: headers
                    };

                    var exch = _this.broadcastExchange;
                    exch.publish(
                        event.name,
                        JSON.stringify(event.payload), options, function (resp) {
                            //wat do
                        });
                }
            }, 100);
        },

        sendAndWaitForReply: function (event, callback) {

            //get the url elements

            console.log('Sending something through amqp on ' + event.url);

            var u = url.parse(event.url, true);

            u.path.replace(/^\/|\/$/g, '');

            var queue = u.hostname + "." + u.path + "." + event.method;
            //var queue = "muon-node-send-" + uuid.v1();
            var replyQueue = queue + ".reply";

            this.queue.listen(replyQueue, callback);
            this.queue.send(queue, event);


            /* Beyond this point is left in for temporary reference until it all works equally well.
             * because at the moment it's still a  bit broken. Yay!

            _this.connection.on('ready', function() {


                _this.resourceExchange.on('open', function () {
                    console.log('resourceExchange initialised');

                    var exch = _this.resourceExchange;

                    var options = {
                        replyTo: replyQueue,
                        contentType: "text/plain"
                    };

                    console.log('Exchange set');

                    _this.connection.queue(queue, {
                        durable: false,
                        exclusive: true,
                        ack: true,
                        autoDelete: true
                    }, function (q) {

                        console.log("Creating reply queue " + replyQueue);

                        q.bind(replyQueue, function () {
                            console.log("Bound resource queue " + replyQueue);

                            exch.publish(queue, event.payload, options, function (test) {
                                console.log("publishing to queue");
                                if (test) {
                                    console.log("Publish to queue failed.");
                                    callback({failure: true});
                                }
                            });
                            q.subscribe(function (message, headers, deliveryInfo, messageObject) {
                                console.log('subscribing to queue');
                                callback(message);
                            });
                        });
                    });
                });

            });

            */


        },

        listenOnBroadcast: function (event, callback) {
            //_this.connection.on('ready', function() {
            var waitInterval = setInterval(function() {
                if(typeof _this.broadcastExchange == 'object') {
                    clearInterval(waitInterval);
                    var queue = "muon-node-broadcastlisten-" + uuid.v1();;

                    console.log("Creating broadcast listen queue " + queue);

                    _this.connection.queue(queue, {
                        durable: false,
                        exclusive: true,
                        ack: true,
                        autoDelete: true
                    }, function (q) {
                        q.bind("muon-broadcast", event, function () {
                            console.log("Bound event queue " + queue);
                            q.subscribe(function (message, headers, deliveryInfo, messageObject) {
                                //todo, headers ...
                                //console.log("Broadcast received");
                                //console.log(message.data.toString());

                                callback({
                                    payload: message.data
                                }, message.data);


                            });
                        });


                    });


                }
            }, 100);
        },

        /**
         *
         * @param resource
         * @param method
         * @param callback
         */

        listenOnResource: function (resource, method, callback) {

            //var queue = _this.serviceIdentifier + "." + resource + "." + method + uuid.v1(); //"muon-node-reslisten-" + uuid.v1();

            resource = resource.replace(/^\/|\/$/g, '');

            var key = _this.serviceIdentifier + "." + resource + "." + method;

            this.queue.listen(key, callback);
        },

        discoverServices: function (callback) {
            callback(_this.discoveredServiceList);
        },

        queue: {
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
        }
    };

    return scope;
};