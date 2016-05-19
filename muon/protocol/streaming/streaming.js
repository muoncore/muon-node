
var nodeUrl = require("url");
var channel = require('../../infrastructure/channel');
var uuid = require('node-uuid');
var RSVP = require('rsvp');
require('sexylog');
var handler = require('../../infrastructure/handler');

var proto = require("./client-protocol")
var simpleapi = require("./client-simple-api")

var serviceName;
var protocols = [];
var protocolName = 'reactive-stream';


/**
 *
 * need to break out the protocol object.
 *
 * break out the api object. Needs to be transformable to other streaming providers
 *
 * Identify the wiring section.
 *
 * The proto object :-
 *
 *  * incoming message handler (from the transport)
 *  * local state
 *  * outgoing message handlers (from the api)
 *  * what is the internal protocol API? document it!
 *
 */


exports.getApi = function (name, transport) {
    serviceName = name;

    var api = {
        name: function () {
            return protocolName;
        },
        subscribe: function (remoteServiceUrl, clientCallback, errorCallback) {

            var serviceRequest = nodeUrl.parse(remoteServiceUrl, true);
            var targetService = serviceRequest.hostname
            
            var transChannel = transport.openChannel(targetService, protocolName);

            var subscriber = simpleapi.subscriber(clientCallback, errorCallback, function() {
                logger.info("Stream subscription is complete, the remote has no more data")
            })

            var targetStream = serviceRequest.path
            var args = {}

            var protocol = proto.create(
                subscriber, 
                transChannel,
                targetService,
                serviceName,
                targetStream,
                args)
            
            protocol.start()

            return subscriber.control
        },
        protocols: function (ps) {
            protocols = ps;
        },
        protocolHandler: function () {
            return {
                // todo, are these needed externally?
                
                server: function () {
                    return serverHandler();
                },
                client: function (remoteServiceUrl) {
                    return clientHandler(remoteServiceUrl);
                }
            }
        }
    }
    return api;
}
