

var amqp = require('amqp');
var uuid = require('node-uuid');
var url = require('url');

module.exports = exports = function amqpTransport() {

    var _this = this;

    var amqpurl = "amqp://localhost";

    var implOpts = {
        reconnect: true,
        reconnectBackoffStrategy: 'linear',
        reconnectBackoffTime: 500 // ms
    };

    this.connection =  amqp.createConnection({ url: amqpurl }, implOpts);
    this.connection.on('ready', function() {

        _this.resourceExchange = _this.connection.exchange();



        /*

        _this.connection.exchange("muon-resource", {
            durable:false,
            type: 'direct',
            autoDelete:false,
            confirm: true
        }, function(exch) {

            _this.resourceExchange = exch;
        });

        */


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

        console.log('Emitting announcements');

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

            var u = url.parse(event.url, true);



            var locImplOpts = {
                reconnect: true,

                reconnectBackoffStrategy: 'linear',
                reconnectBackoffTime: 2000 // ms
            };

            var queue = u.hostname + "." + u.path + "." + event.method;
            var replyQueue = queue + ".reply";

            _this.connection.on('ready', function() {


                _this.resourceExchange.on('open', function() {
                    console.log('resourceExchange initialised');

                    var exch = _this.resourceExchange;

                    var options = {
                        replyTo : replyQueue,
                        contentType: "text/plain"
                    };

                    console.log('Exchange set');

                    _this.connection.queue(replyQueue, {
                        durable: false,
                        exclusive: true,
                        ack: true,
                        autoDelete: true
                    }, function (q) {

                        console.log("Creating queue " + replyQueue);

                        q.bind(replyQueue, function () {
                            console.log("Bound resource queue " + replyQueue);

                            exch.publish(queue, event.payload, options, function(test) {
                                console.log("publishing to queue");
                                if(test) {
                                    console.log("Publish to queue failed.");
                                    callback({failure: true});
                                }
                            });
                            q.subscribe(function (message, headers, deliveryInfo, messageObject) {
                                callback(message);
                            });
                        });
                    });
                });

            });
        },

        listenOnBroadcast: function (event, callback) {
            //_this.connection.on('ready', function() {
            var waitInterval = setInterval(function() {
                if(typeof _this.broadcastExchange == 'object') {
                    clearInterval(waitInterval);
                    var queue = "muon-node-broadcastlisten-" + uuid.v1();

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
                                console.log("Broadcast received");
                                console.log(message.data.toString());

                                callback({
                                    payload: message.data
                                }, message.data);
                            });
                        });
                    });
                }
            }, 100);
        },

        listenOnResource: function (resource, method, callback) {
            _this.connection.on('ready', function() {
                var queue = _this.serviceIdentifier + "." + resource + "." + method; //"muon-node-reslisten-" + uuid.v1();

                console.log("Creating queue " + queue);

                _this.connection.queue(queue, {
                    durable: false,
                    exclusive: false,
                    ack: true,
                    autoDelete: true
                }, function (q) {

                    q.bind(_this.serviceIdentifier + "." + resource + "." + method, function () {
                        console.log("Bound resource queue " + _this.serviceIdentifier + "." + resource + "." + method);
                        q.subscribe(function (message, headers, deliveryInfo, messageObject) {
                            var replyTo = messageObject.replyTo;
                            console.log("Got a message");

                            callback({
                                payload: message.data
                            }, message.data, function(response) {
                                _this.connection.publish(replyTo, JSON.stringify(response), {
                                    "contentType": "text/plain"
                                });
                            });
                        });
                    });
                });
            }, 100);
        },

        discoverServices: function (callback) {
            callback(_this.discoveredServiceList);
        }

    };

    return scope;
};