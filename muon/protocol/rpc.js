"use strict";

var nodeUrl = require("url");
//var RpcProtocol = require('../protocol/rpc-protocol.js');
var channel = require('../infrastructure/channel.js');
var uuid = require('node-uuid');
var RSVP = require('rsvp');
require('sexylog');
var Handler = require('../infrastructure/handler-class.js');
var messages = require('../domain/messages.js');

var client = require("./rpc/rpc-client")
var server = require("./rpc/rpc-server")

var handlerMappings = {};
var serviceName;
var protocolName = 'rpc';


exports.create = function (muon) {

  logger.info("Calling api with name " + muon.infrastructure().serviceName)

  var rpcApi = exports.getApi(muon.infrastructure().serviceName, muon.infrastructure());

  muon.addServerStack(rpcApi)

  muon.request = function (remoteServiceUrl, data, clientCallback) {
    return rpcApi.request(remoteServiceUrl, data, clientCallback);
  }
  muon.requestWithAuth = function (remoteServiceUrl, data, auth, clientCallback) {
    return rpcApi.requestWithAuth(remoteServiceUrl, data, auth, clientCallback);
  }
  muon.handle = function (endpoint, callback) {
    rpcApi.handle(endpoint, callback);
  }
}

exports.getApi = function (name, infrastructure) {
  serviceName = name;
  var _this = this

  this.requestWithAuth = function (remoteServiceUrl, data, auth, clientCallback) {

    var parsedUrl = nodeUrl.parse(remoteServiceUrl, true);

    var request = {
      url: remoteServiceUrl,
      auth: auth,
      body: data
    }

    var promise = new RSVP.Promise(function (resolve, reject) {

      var exec = (event) => {
        if (!event) {
          logger.warn('client-api promise failed check! calling promise.reject()');
          reject(event);
        } else {
          logger.trace('promise calling promise.resolve() event.id=' + event.id);
          logger.debug("RPC Incoming message is " + JSON.stringify(event))
          resolve(event);
        }
      }

      if (clientCallback) exec = clientCallback

      var transportPromise = infrastructure.getTransport();
      transportPromise.then(function (transport) {
        var transChannel = transport.openChannel(parsedUrl.hostname, protocolName);

        transChannel.listen((msg) => {
          proto.fromTransport(msg)
        })

        var proto = client({
          log: logger,
          type: (name, payload) => {
            //TODO, validation & conversion?
            return payload
          },
          sendApi: (msg) => {
            msg.body = messages.decode(msg.body, msg.content_type)
            delete msg.content_type
            exec(msg)
          },
          shutdown: () => {
            logger.debug("Shutdown has been called on RPC Client. No-op")
          },
          encodeFor: (msg, service) => {
            return {
              payload: messages.encode(msg),
              contentType: "application/json"
            }
          },
          sendTransport: (msg) => {
            try {
              transChannel.send(messages.muonMessage(msg.payload, serviceName, msg.targetService, protocolName, msg.step))
            } catch (e) {
              logger.warn(e)
            }
          },
          decode: (type, msg) => {
            return messages.decode(msg.payload, msg.content_type);
          }
        })

        proto.fromApi(request)
      });
    });

    return promise;

  }

  var api = {
    name: function () {
      return protocolName;
    },
    endpoints: function () {
      var endpoints = [];

      for (var key in handlerMappings) {
        // ; = handlerMappings[key].toString();
        endpoints.push(key);
      }
      return endpoints;
    },
    request: function (remoteServiceUrl, data, clientCallback) {
      return this.requestWithAuth(remoteServiceUrl, data, null, clientCallback)
    }.bind(_this),
    requestWithAuth: this.requestWithAuth,
    handle: function (endpoint, callback) {
      logger.debug('[*** API ***] registering handler endpoint: ' + endpoint);
      handlerMappings[endpoint] = callback;
      logger.trace('handlermappings=' + JSON.stringify(handlerMappings));
      //console.dir(handlerMappings);
    },
    protocolHandler: function () {
      return {
        server: function () {
          return serverHandler();
        }
      }
    }
  }
  return api;
}


function serverHandler() {

  var incomingMuonMessage;

  class RpcProtocolHandler extends Handler {

    outgoingFunction(message, forward, back, route, close) {
      logger.debug("[*** PROTOCOL:SERVER:RPC ***] server rpc protocol outgoing message=%s", JSON.stringify(message));
      var serverResponse = {
        status: 200,
        body: messages.encode(message),
        content_type: "application/json"
      };
      var outboundMuonMessage = messages.muonMessage(serverResponse, serviceName, incomingMuonMessage.origin_service, protocolName, "request.response");
      logger.trace("[*** PROTOCOL:SERVER:RPC ***] rpc protocol outgoing muonMessage=" + JSON.stringify(outboundMuonMessage));
      forward(outboundMuonMessage);
      close('server_outgoing');

    }

    incomingFunction(message, forward, back, route, close) {

      logger.info("GOT MESSAGE FROM CLIENT")

      if (!message) {
        logger.warn('received empty message');
        back({});
      }
      incomingMuonMessage = message;
      logger.debug("[*** PROTOCOL:SERVER:RPC ***] rpc protocol incoming message=%s", JSON.stringify(incomingMuonMessage));
      logger.trace("[*** PROTOCOL:SERVER:RPC ***] rpc protocol incoming message type=%s", (typeof incomingMuonMessage));
      if (message.protocol == 'muon') {
        logger.error(JSON.stringify(message))
        return;
      }
      if (message.step == "ChannelShutdown") {
        return
      }
      try {
        var payload = messages.decode(incomingMuonMessage.payload, incomingMuonMessage.content_type);
        logger.info("[*** PROTOCOL:SERVER:RPC ***] RPC payload =%s", JSON.stringify(payload));
        logger.trace('handlermappings=' + JSON.stringify(handlerMappings));
        if (payload && payload.url) {
          var endpoint = payload.url;
          payload.body = messages.decode(payload.body, payload.content_type);
          var path = '/' + endpoint.split('/')[3];
          var handler = handlerMappings[path];
          if (!handler) {
            logger.warn('[*** PROTOCOL:SERVER:RPC ***] NO HANDLER FOUND FOR ENDPOINT: "' + path + '" RETURN 404! event.id=' + incomingMuonMessage.id);
            payload.status = 404;
            var return404msg = messages.resource404(incomingMuonMessage, payload);
            back(return404msg);
          } else {
            logger.info('[*** PROTOCOL:SERVER:RPC ***] Handler found for endpoint "' + path + '" event.id=' + incomingMuonMessage.id);
            route(payload, path);
          }
        } else {
          logger.warn("Seemingly invalid RPC message received. Expect a payload and payload.url")
        }
      } catch (err) {
        logger.warn('[*** PROTOCOL:SERVER:RPC ***] error thrown during protocol message decoding and handling');
        logger.warn(err);
      }

      if (message.channel_op == 'closed') {
        shutdown();
        close('server_incoming');
        return;
      }
    }
  }
  ;

  var rpcProtocolHandler = new RpcProtocolHandler('server-rpc', handlerMappings);
  return rpcProtocolHandler;
}

function shutdown() {
  logger.warn('rpc protocol shutdown() called');
}
