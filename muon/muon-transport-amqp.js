
/*

*/


module.exports = function amqpTransport() {

    var util = require('../lib/util.js');

    var _this = this;

    var uuid = require('node-uuid');
    var url = require('url');

    this.discoveredServiceList = [];
    this.discoveredServices = [];

    this.queue = require('./muon-queue.js')();

    //_this.exch = new queue();
    this.queue.connect();
    //_this.exch.connect();

    this.queue.connection.on('ready', function() {

        _this.resourceExchange = _this.queue.connection.exchange("", {
            durable:false,
            type: 'direct',
            autoDelete:false,
            confirm: true
        });

        console.log('I am readin');
        _this.queue.connection.exchange("muon-broadcast", {
            durable:false,
            autoDelete:false
        }, function(exch) {
            _this.broadcastExchange = exch;

            startAnnouncements();
        });
    });

    var scope = {

        exch: {},

        setServiceIdentifier: function(serviceIdentifier) {
            _this.serviceIdentifier = serviceIdentifier;
        },

        emit: function(event) {
            console.log('Emitting event');

            var waitInterval = setInterval(function() {

                if (typeof _this.broadcastExchange === 'object') {

                    clearInterval(waitInterval);

                    console.log('Event emitted');
                    console.dir(event);

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
                } else {

                }

            }, 100);
        },

        sendAndWaitForReply: function(event, callback) {
            //get the url elements

            console.log('Sending something through amqp on ' + event.url);

            var u = url.parse(event.url, true);

            u.path.replace(/^\/|\/$/g, '');

            var queue = u.hostname + "." + u.path + "." + event.method;
            //var queue = "muon-node-send-" + uuid.v1();
            var replyQueue = queue + ".reply";

            _this.queue.listen(replyQueue, callback);
            _this.queue.send(queue, event);
        },

        listenOnBroadcast: function(event, callback) {
            var waitInterval = setInterval(function() {
                if(typeof _this.broadcastExchange == 'object') {
                    clearInterval(waitInterval);
                    var queue = "muon-node-broadcastlisten-" + uuid.v1();;

                    console.log("Creating broadcast listen queue " + queue);

                    _this.queue.connection.queue(queue, {
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

        listenOnResource: function(resource, method, callback) {
            resource = resource.replace(/^\/|\/$/g, '');

            var key = _this.serviceIdentifier + "." + resource + "." + method;

            _this.queue.listen(key, callback);
        },

        discoverServices: function(callback) {
            callback(_this.discoveredServiceList);
        }
    };



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

    return scope;
};