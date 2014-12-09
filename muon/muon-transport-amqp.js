
var amqp = require('amqp');
var uuid = require('node-uuid');

var amqpurl = "amqp://localhost";

var implOpts = {
    reconnect: true,
    reconnectBackoffStrategy: 'linear',
    reconnectBackoffTime: 500 // ms
};

module.connection = amqp.createConnection({ url: amqpurl }, implOpts);
module.connection.on('ready', function() {
    module.connection.exchange("muon-resource", {
        durable:false,
        autoDelete:false
    }, function(exch) {

        module.resourceExchange = exch;
    });
    module.connection.exchange("muon-broadcast", {
        durable:false,
        autoDelete:false
    }, function(exch) {
        module.broadcastExchange = exch;

        startAnnouncements();
    });
});
module.connection.on('error', function (msg) {
    console.log("Getting an error");
    console.dir(msg);
});

module.discoveredServiceList = [];
module.discoveredServices = [];

setTimeout(function() {
   //todo, bootup the announcement/ detection
});

module.exports.setServiceIdentifier = function(serviceIdentifier) {
    module.serviceIdentifier = serviceIdentifier;
}

module.exports.emit= function(event) {

    var headers = {};
    if (event.headers instanceof Object) {
        headers = event.headers;
    }

    var options = {
        headers:headers
    };

    var exch = module.broadcastExchange;
    exch.publish(
        event.name,
        JSON.stringify(event.payload), options, function(resp) {
    });
};

module.exports.sendAndWaitForReply=function (event, callback) {

};
module.exports.listenOnBroadcast = function (event, callback) {
    //todo, discover what resource we need to wait for. less than 50ms and setup isn't completed and the queues
    // don't attach correctly.
    setTimeout(function () {
        var queue = "muon-node-broadcastlisten-" + uuid.v1();

        console.log("Creating queue " + queue);

        module.connection.queue(queue, {
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
    }, 200);
};
module.exports.listenOnResource = function (resource, method, callback) {
    //todo, discover what resource we need to wait for. less than 50ms and setup isn't completed and the queues
    // don't attach correctly.
    setTimeout(function () {
        var queue = "muon-node-reslisten-" + uuid.v1();

        console.log("Creating queue " + queue);

        module.connection.queue(queue, {
            durable: false,
            exclusive: true,
            ack: true,
            autoDelete: true
        }, function (q) {

            q.bind("muon-resource", module.serviceIdentifier + "." + resource + "." + method, function () {
                q.subscribe(function (message, headers, deliveryInfo, messageObject) {
                    var replyTo = messageObject.replyTo;

                    callback({
                        payload: message.data
                    }, message.data, function(response) {
                        module.connection.publish(replyTo, JSON.stringify(response), {
                            "contentType": "text/plain"
                        });
                    });
                });
            });
        });
    }, 100);
};
module.exports.discoverServices=function(callback) {
    callback(module.discoveredServiceList);
};

function startAnnouncements() {
    module.exports.listenOnBroadcast("serviceAnnounce", function(event) {
        var pay = JSON.parse(event.payload.toString());
        if(module.discoveredServiceList.indexOf(pay.identifier) < 0) {
            module.discoveredServiceList.push(pay.identifier);
            module.discoveredServices.push(pay);
        }
    });

    module.exports.emit({
        name:"serviceAnnounce",
        payload:{
            identifier:module.serviceIdentifier
        }
    });

    setInterval(function() {
        module.exports.emit({
            name:"serviceAnnounce",
            payload:{
                identifier:module.serviceIdentifier
            }
        });
    }, 3500);
}
