var nodeUrl = require("url");
var channel = require('../../infrastructure/channel');
var uuid = require('node-uuid');
var RSVP = require('rsvp');
require('sexylog');
var handler = require('../../infrastructure/handler');
var messages = require('./messages');

var serviceName;
var protocols = [];
var protocolName = 'streaming';


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
        subscribe: function (remoteService, clientCallback, errorCallback) {

            /** wiring **/

            var transChannel = transport.openChannel(remoteService, protocolName);
            var clientChannel = channel.create("client-api");
            var rpcProtocolClientHandler = clientHandler(remoteService);
            clientChannel.rightHandler(rpcProtocolClientHandler);
            transChannel.handler(rpcProtocolClientHandler);

            /** end wire **/

            //todo, create protocol instance and hook in between clientChannel and transChannel
            //todo, add an API to return.

            
            
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
