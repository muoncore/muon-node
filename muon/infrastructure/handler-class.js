"use strict";

class Handler {




  constructor(n, handlers) {
    if (this.incomingFunction === undefined) {
      throw new TypeError("Must override method incomingFunction()");
    }

    if (this.outgoingFunction === undefined) {
      throw new TypeError("Must override method outgoingFunction()");
    }

    if (! n) n = 'default';
    this.name = n + '-handler';
    if (handlers) {
      this.callbacks = handlers;
    } else {
      this.callbacks = {};
    }

    //this.upstreamConnection = {};
    //this.downstreamConnection = {};



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
      var route = this.createRoute(this.upstreamConnection, this.incomingFunction);
      this.outgoingFunction(msg, accept, reject, route);
  }

  sendUpstream(msg, accept, reject) {
      logger.debug('[*** CSP-CHANNEL:HANDLER ***] ' + this.name + ' sending message via handler upstream event.id=' + JSON.stringify(msg));
      var route = this.createRoute(this.downstreamConnection, this.outgoingFunction);
      this.incomingFunction(msg, accept, reject, route);
  }

  getUpstreamConnection() {
      return this.upstreamConnection;
  }

  getDownstreamConnection() {
      return this.downstreamConnection;
  }

  setUpstreamConnection(c) {
      //logger.error(this.name + ' setUpstreamConnection(c=' +  JSON.stringify(c) + ')');
      //console.dir(c);
      this.upstreamConnection = c;
  }

  setDownstreamConnection(c) {
      //logger.error(this.name + ' setDownstreamConnection(c=' +  JSON.stringify(c) + ')');
      //console.dir(c);
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
      //logger.error('this.upstreamConnection=' +  JSON.stringify(this.upstreamConnection));
      //logger.error('this.upstreamConnection=', this.upstreamConnection);
      //console.dir(this.upstreamConnection);
      //logger.error('this.downstreamConnection=' +  JSON.stringify(this.downstreamConnection));
      //console.dir(this.downstreamConnection);
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


  createRoute(otherConnection, handlerFunction) {
      var _callbacks = this.callbacks;

      var route = function(message, key) {
          var callbackHandler = _callbacks[key];
          if (! callbackHandler) throw new Error('unable to find callback handler for key: ' + key);

          var tempCallback = function(response) {
              logger.trace('[*** CSP-CHANNEL:HANDLER ***] callback handler returned response for key: ' + key);
              var accept = function(result) {
                  otherConnection.send(result);
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

}






module.exports = Handler;
