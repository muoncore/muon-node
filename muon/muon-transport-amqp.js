
var _this = module.exports;

var amqp = require('amqp');
var uuid = require('node-uuid');
var url = require('url');

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
        autoDelete:false,
        confirm: true
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
	console.log("Setting service identifier.");
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

module.exports.sendAndWaitForReply = function (event, callback) {
	
	//get the url elements
	
	var u = url.parse(event.url, true);
	
	var locImplOpts = {
		reconnect: true,
		reconnectBackoffStrategy: 'linear',
		reconnectBackoffTime: 2000 // ms
	};
	
	var queue = u.hostname + "." + u.path + "." + event.method;
	var replyQueue = queue + ".reply";
	
	connection = amqp.createConnection({ url: amqpurl }, locImplOpts);
	
	connection.on('ready', function() {
		
		console.log("Connected");
		
		connection.exchange("muon-resource", {
			durable:false,
			autoDelete:false,
			confirm: true
		}, function(exch) {
			
			var options = {
				replyTo : replyQueue,
				contentType: "text/plain"
			};

			console.log('Exchange set');
			
			connection.queue(replyQueue, {
				durable: false,
				exclusive: true,
				ack: true,
				autoDelete: true
			}, function (q) {
				
				console.log("Creating queue " + replyQueue);
				
				q.bind("muon-resource", replyQueue, function () {
					console.log("Bound resource queue " + replyQueue);
					
					exch.publish(queue, event.payload, options, function(test) {
						console.log("publishing to queue");
						if(test) {
							console.log("Publish to queue failed.");
							callback({failure: true});
						}
					});
					q.subscribe(function (message, headers, deliveryInfo, messageObject) {
						//var replyTo = messageObject.replyTo;
						//console.log("Got a response");
						//console.dir(message);
						callback(message);
						
						
					});
				});
				
				
				
				
			});
			
		});
		
	});
	
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
            exclusive: false,
            ack: true,
            autoDelete: true
        }, function (q) {

            q.bind("muon-resource", module.serviceIdentifier + "." + resource + "." + method, function () {
				console.log("Bound resource queue " + module.serviceIdentifier + "." + resource + "." + method);
                q.subscribe(function (message, headers, deliveryInfo, messageObject) {
                    var replyTo = messageObject.replyTo;
					console.log("Got a message");

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
