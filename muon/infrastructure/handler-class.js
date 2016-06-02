"use strict";

class Handler {




  constructor(n, handlers) {
    if (! n) n = 'default';
    this.name = n + '-handler';
    if (handlers) this.callbacks = handlers;

    this.callbacks = {};
    this.name;
    this.outgoingFunction = function() {console.log('DEFUALT OUTGOING HANDLER FUNCTON NOT SET')};
    this.incomingFunction = function() {console.log('DEFUALT INCOMING HANDLER FUNCTON NOT SET')};;

    this.upstreamConnection;
    this.downstreamConnection;
  }



  outgoing(f) {
      this.outgoingFunction = f;
  }

  incoming(f) {
      this.incomingFunction = f;
  }

  register(callback, key) {
      this.callbacks[key] = callback;
  }

  sendDownstream(msg, accept, reject) {
      logger.debug('[*** CSP-CHANNEL:HANDLER ***] ' + this.name + ' sending message via handler downstream msg: ' +  JSON.stringify(msg));
      var route = createRoute(this.upstreamConnection, this.incomingFunction);
      this.outgoingFunction(msg, accept, reject, route);
  }

  sendUpstream(msg, accept, reject) {
      logger.debug('[*** CSP-CHANNEL:HANDLER ***] ' + this.name + ' sending message via handler upstream event.id=' + JSON.stringify(msg));
      var route = createRoute(this.downstreamConnection, this.outgoingFunction);
      this.incomingFunction(msg, accept, reject, route);
  }

  getUpstreamConnection() {
      return this.upstreamConnection;
  }

  getDownstreamConnection() {
      return this.downstreamConnection;
  }

  upstreamConnection(c) {
      this.upstreamConnection = c;
  }

  downstreamConnection(c) {
      this.downstreamConnection = c;
  }

  otherConnection(conn) {
      if (conn === this.upstreamConnection.name()) {
          logger.trace('[*** CSP-CHANNEL:HANDLER ***]  ' + this.name + ' other connection is downstream: ' + this.downstreamConnection.name());
          return this.downstreamConnection;
      } else {
          logger.trace('[*** CSP-CHANNEL:HANDLER ***] ' + this.name + ' other connection is upstream: ' + this.upstreamConnection.name());
          return this.upstreamConnection;
      }
  }

  thisConnection(conn) {
      if (this.upstreamConnection && conn === this.upstreamConnection.name()) {
          logger.trace('[*** CSP-CHANNEL:HANDLER ***]  ' + this.name + ' other connection is downstream: ' + this.downstreamConnection.name());
          return this.upstreamConnection;
      } else {
          var upstreamConnectionName = 'unset';
          if (this.upstreamConnection) upstreamConnectionName = this.upstreamConnection.name();
          logger.trace('[*** CSP-CHANNEL:HANDLER ***] ' + this.name + ' other connection is upstream: ' + upstreamConnectionName);
          return this.downstreamConnection;
      }
  }

}



function createRoute(otherConnection, handlerFunction) {


    var route = function(message, key) {
        var callbackHandler = this.callbacks[key];

        if (! this.callbackHandler) throw new Error('unable to find callback handler for key: ' + key);

        var tempCallback = function(response) {
            logger.trace('[*** CSP-CHANNEL:HANDLER ***] callback handler returned response for key: ' + key);
            var accept = function(result) {
                this.otherConnection.send(result);
            };

            var reject = function(result) {
                callbackHandler({}, error);
            };
            logger.trace('[*** CSP-CHANNEL:HANDLER ***] calling onward function for key: ' + key);
            handlerFunction(response, accept, reject);
        }
        logger.trace('[*** CSP-CHANNEL:HANDLER ***]  executing routed callback handler for key: ' + key);
        callbackHandler(message, tempCallback);
    };

    return route;

}


module.exports = Handler;
