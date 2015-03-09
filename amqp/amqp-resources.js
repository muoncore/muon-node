
var url = require("url");

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

            logger.debug('Dispatch resource request on ' + event.url);

            var u = url.parse(event.url, true);

            var queue = "resource-listen." + u.hostname;
            var replyQueue = queue + ".reply";

            module.queues.listen(replyQueue, callback);

            event.headers = {
                "verb":event.method,
                "RESOURCE":u.path,
                "RESPONSE_QUEUE":replyQueue
            };

            module.queues.send(queue, event);
        },

        listenOnResource: function(resource, method, callback) {
            resource = resource.replace(/^\/|\/$/g, '');
            var key = resource + "-" + method;
            resourceHandlers[key] = callback;
        }
    };
};

function setupResourceHandler(handlers) {
    var waitInterval = setInterval(function () {

        if (typeof module.queues == 'object' && module.serviceIdentifier !== 'undefined') {
            clearInterval(waitInterval);

            var resourceQueueName = 'resource-listen.' + module.serviceIdentifier;

            module.queues.listen(resourceQueueName, function (request, message) {
                var verb = request.headers.verb;
                var resource = request.headers.RESOURCE;
                resource = resource.replace(/^\/|\/$/g, '');
                var key = resource + "-" + verb;
                var responseQueue = request.headers.RESPONSE_QUEUE;

                logger.debug("Received resource request " + key);
                logger.debug("Response requested on " + responseQueue);

                var handler = function(request, message, response) {
                    response({
                        "message":"no resource with the name " + resource + " with method " + verb
                    }, {
                        "Status":"404"
                    })
                };
                if (key in handlers && typeof handlers[key] !== 'undefined') {
                    logger.trace("Found " + key + " in registered handlers");
                    handler = handlers[key];
                }
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
