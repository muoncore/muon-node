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

  class RpcProtocolHandler {

    setDownstreamConnection(channelConnection) { this.left = channelConnection }
    setUpstreamConnection(channelConnection) { this.right = channelConnection }

    sendUpstream(message) {

      var _this = this;

      if (!message) {
        logger.warn('received empty message');
        this.left.send({})
        return
      }
      var incomingMuonMessage = message;
      logger.debug("[*** PROTOCOL:SERVER:RPC ***] rpc protocol incoming message=%s", JSON.stringify(incomingMuonMessage));
      logger.trace("[*** PROTOCOL:SERVER:RPC ***] rpc protocol incoming message type=%s", (typeof incomingMuonMessage));
      if (message.protocol == 'muon') {
        logger.error(JSON.stringify(message))
        return;
      }
      if (message.step == "ChannelShutdown") {
        return
      }

      var serverProto = server({
        log: logger,
        state: (name) => {
          if (name == "getHandler") {
            return  (request) => {

              console.dir(request)
              var url = nodeUrl.parse(request.url, true);
              var path = url.pathname

              var handler = handlerMappings[path]

              if (!handler) {
                return (respondToProto) => {
                  respondToProto({
                    status: 404,
                    payload: "not found"
                  })
                }
              }

              return (respondToProto) => {
                handler(request, (response) => {
                  respondToProto({
                    status: 200,
                    payload: response
                  })
                })
              }
            }
          }
          return {}
        },
        type: (name, payload) => {
          //TODO, validation & conversion?
          return payload
        },
        shutdown: () => {
          logger.debug("Shutdown has been called on RPC Server. No-op")
          _this.left.close();
        },
        encodeFor: (msg, service) => {
          return {
            payload: messages.encode(msg),
            contentType: "application/json"
          }
        },
        sendTransport: (msg) => {
          try {
            _this.left.send(messages.muonMessage(msg.payload, serviceName, msg.targetService, protocolName, msg.step))
          } catch (e) {
            logger.warn(e)
          }
        },
        decode: (type, msg) => {
          var unwrapped = messages.decode(msg.payload, msg.content_type);
          unwrapped.body = messages.decode(unwrapped.body)

          return unwrapped
        }
      });

      message.sourceServiceName = message.origin_service

      serverProto.fromTransport(message)
    }
  }

  var rpcProtocolHandler = new RpcProtocolHandler('server-rpc', handlerMappings);
  return rpcProtocolHandler;
}

function shutdown() {
  logger.warn('rpc protocol shutdown() called');
}
