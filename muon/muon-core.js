
var amqp = require('amqp');
var uuid = require('node-uuid');

module.exports = function(serviceIdentifier) {

    module.serviceIdentifier = serviceIdentifier;

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
        });
    });
    module.connection.on('error', function (msg) {
        console.log("Getting an error");
        console.dir(msg);
    });

    return {
        onBroadcast:function(event, callback) {
            listenOnBroadcast(event, callback);
        },
        onGet:function(resource,doc, callback) {
            listenOnResource(resource, "get", callback);
        },
        onPost:function(resource,doc, callback) {
            listenOnResource(resource, "post", callback);
        },
        onPut:function(resource,doc, callback) {
            listenOnResource(resource, "put", callback);
        },
        onDelete:function(resource,doc, callback) {
            listenOnResource(resource, "delete", callback);
        }
        //TODO, resource access methods
        //TODO, send broadcast
    }
};

function listenOnBroadcast(event, callback) {
    //todo, discover what resource we need to wait for. less than 50ms and setup isn't completed and the queues
    // don't attach correctly.
    setTimeout(function() {
        var queue = "muon-node-broadcastlisten-" + uuid.v1();

        console.log("Creating queue " + queue );

        module.connection.queue(queue, {
            durable:false,
            exclusive:true,
            ack:true,
            autoDelete:true
        }, function(q) {
            q.bind("muon-broadcast", event, function() {
                console.log("Bound event queue " + queue );
                q.subscribe(function (message, headers, deliveryInfo, messageObject) {
                    //todo, headers ...
                    console.log("Broadcast received");
                    console.log(message.data.toString());

                    callback({
                        payload:message.data
                    }, message.data);
                });
            });
        });
    }, 400);
}

function listenOnResource(resource, method, callback) {
    //todo, discover what resource we need to wait for. less than 50ms and setup isn't completed and the queues
    // don't attach correctly.
    setTimeout(function() {
        var queue = "muon-node-reslisten-" + uuid.v1();

        console.log("Creating queue " + queue );

        module.connection.queue(queue, {
            durable:false,
            exclusive:true,
            ack:true,
            autoDelete:true
        }, function(q) {

        q.bind("muon-resource", module.serviceIdentifier + "." + resource + "." + method, function() {
            q.subscribe(function (message, headers, deliveryInfo, messageObject) {
                var replyTo = messageObject.replyTo;

                var response = callback({
                    payload:message.data
                }, message.data);

//                if (isNullOrUndefined(response)) {
//                    console.error("Handler for " + method + " " + resource + " did not return any response message, this is incorrect" );
//                }

                module.connection.publish(replyTo, JSON.stringify(response), {
                    "contentType": "text/plain"
                });
            });
        });
        });
    }, 100);
}
