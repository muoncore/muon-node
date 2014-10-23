
var amqp = require('amqp');
var uuid = require('node-uuid');

module.exports = function(serviceIdentifier) {

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
        console.dir(msg);
    });

    return {
        onBroadcast:function(callback) {

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

function listenOnResource(resource, method, callback) {

    setTimeout(function() {
        var queue = "muon-node-reslisten-" + uuid.v1();

        console.log("Creating queue " + queue );

        module.connection.queue(queue, {
            durable:false,
            exclusive:true,
            ack:true,
            autoDelete:true
        }, function(q) {

//        //todo, get the service ident
        q.bind("muon-resource", "tck." + resource + "." + method, function() {
            q.subscribe(function (message, headers, deliveryInfo, messageObject) {
                console.log('Got a message with routing key ' + deliveryInfo.routingKey);
                console.dir(messageObject);
                console.log('Headers');
                console.dir(headers);
                console.log('Delivery');
                console.dir(deliveryInfo);

                var replyTo = messageObject.replyTo;
//                messageObject.acknowledge(false);

                //TODO, the reply ....
                var response = callback({
                    payload:message.data
                }, message.data);

                module.connection.publish("", replyTo, response,{
                    //"coreelection":""
                }, function(arg) {
                    console.dir(arg);
                    console.log("Response away!");
                });
                module.connection.ack

            });
        });
        });
    }, 200);
}
