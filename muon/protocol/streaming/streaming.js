
var nodeUrl = require("url");
var uuid = require('node-uuid');
require('sexylog');
var _ = require("underscore")
var proto = require("./client-protocol")
var simpleapi = require("./client-simple-api")

var serviceName;
var protocols = [];
var protocolName = 'reactive-stream';

exports.getApi = function (name, infra) {
    serviceName = name;

    var api = {
        name: function () {
            return protocolName;
        },

        replay: function(streamName, config, clientCallback, errorCallback, completeCallback) {
            var ret = {}
            var muon = this
            infra.discovery.discoverServices(function(services) {
                var store = services.findServiceWithTags(["eventstore"])

                if (store == null || store == undefined) {
                  errorCallback({
                    status: "FAILED",
                    cause: "No event store could be found, is Photon running?"
                  })
                  return
                }

                config['stream-name'] = streamName

                logger.debug("Found event store: " +JSON.stringify(store))

                var subscriber = muon.subscribe("stream://" + store.identifier + "/stream", config, clientCallback, errorCallback, completeCallback)

                ret.cancel = subscriber.cancel
            })
            return ret
        },
        subscribe: function (remoteServiceUrl, params, clientCallback, errorCallback, completeCallback) {

            infra.getTransport().then(function(transport) {
                try {
                    logger.debug("Subscribing to " + remoteServiceUrl + " with params " + JSON.stringify(params))
                    var serviceRequest = nodeUrl.parse(remoteServiceUrl, true);
                    var targetService = serviceRequest.hostname
                    var transChannel = transport.openChannel(targetService, protocolName);
                    var targetStream = serviceRequest.path;
                    var args = params;
                    var protocol = proto.create(
                        subscriber,
                        transChannel,
                        targetService,
                        serviceName,
                        targetStream,
                        args);
                    protocol.start();
                } catch (e) {
                    logger.error("Error in stream subscription initialisation ", e)
                }
            });

            var subscriber = simpleapi.subscriber(clientCallback, errorCallback, completeCallback);
            return subscriber.control;
        },
        protocols: function (ps) {
            protocols = ps;
        }
    }
    return api;
}
