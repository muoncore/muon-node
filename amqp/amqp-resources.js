
module.exports = function(queues) {

    //module.serviceIdentifier = serviceIdentifier;
    module.queues = queues;

    var resourceHandlers = {};

    setupResourceHandler(resourceHandlers);

    return {
        setServiceIdentifier: function(ident) {
            module.serviceIdentifier = ident;
        },
        sendAndWaitForReply: function(event, callback) {
            //get the url elements

            console.log('Sending something through amqp on ' + event.url);

            var u = url.parse(event.url, true);

            u.path.replace(/^\/|\/$/g, '');

            var queue = u.hostname + "." + u.path + "." + event.method;
            //var queue = "muon-node-send-" + uuid.v1();
            var replyQueue = queue + ".reply";

            module.queues.listen(replyQueue, callback);
            module.queues.send(queue, event);
        },

        listenOnResource: function(resource, method, callback) {
            resource = resource.replace(/^\/|\/$/g, '');
            var key = resource + "-" + method;
            console.log("Storing handler for " + key);
            resourceHandlers[key] = callback;
        }
    };
};

function setupResourceHandler(handlers) {
    var waitInterval = setInterval(function () {
        console.log('Setting up resource listener ' + module.serviceIdentifier);

        if (typeof module.queues == 'object' && module.serviceIdentifier !== 'undefined') {
            clearInterval(waitInterval);

            var resourceQueueName = 'resource-listen.' + module.serviceIdentifier;

            console.log('Listening for resources on ' + resourceQueueName);

            module.queues.listen(resourceQueueName, function (request, message) {
                console.log("REQUEST!!!");
                console.dir(request);
                var verb = request.headers.verb;
                var resource = request.headers.RESOURCE;
                resource = resource.replace(/^\/|\/$/g, '');
                var key = resource + "-" + verb;
                var responseQueue = request.headers.RESPONSE_QUEUE;

                console.log("Received resource request " + key);
                console.log("Response requested on " + responseQueue);

                //TODO, look up the resource handler
                //TODO, get a response and send it.

                //TODO, have a 404 handler built in here.
                //the 404 handler
                var handler = function(request, message, response) {
                    response({
                        "message":"no resource with the name " + resource + " with method " + verb
                    }, {
                        "Status":"404"
                    })
                };
                if (key in handlers && typeof handlers[key] !== 'undefined') {
                    console.log("Found " + key + " in registered handlers");
                    handler = handlers[key];
                }
                console.log("Trying now " + handler);
                handler({
                    verb:verb,
                    resource:resource
                }, message, function(response, headers) {
                    if (typeof headers === 'undefined') {
                        headers = {};
                    }
                    module.queues.send(responseQueue, {
                        "headers":headers,
                        "payload":response
                    });
                });

            });
        }
    }, 100);
}
