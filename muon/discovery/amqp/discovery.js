var _ = require("underscore");
var AmqpConnection = require('./infra/amqp-connection.js');
var Broadcast = require('./infra/amqp-broadcast.js');
require('sexylog');

var AmqpDiscovery = function (url) {
  this.url = url;
  this.running = false;
}

AmqpDiscovery.prototype.connect = function (onReady, addFoundServices, serviceList) {
  logger.debug("[*** DISCOVERY:BOOTSTRAP ***] AMQP Discovery is booting using URL " + this.url);
  this.connection = new AmqpConnection(this.url);
  var _this = this

  this.addFoundServices = addFoundServices
  this.serviceList = serviceList

  _this.connection.connect(function () {
    logger.info("[*** DISCOVERY:BOOTSTRAP ***] AMQP Discovery is ready!!");
    _this.broadcast = new Broadcast(_this.connection);
    _this.listenToServices()

    // request the full service document
    _this.requestServiceList(function() {
      _this.running = true;
      onReady()
    })

    //by this time, we have a full list of services anyway
    setTimeout(function () {
      _this.running = true;
      onReady()
    }, 5500)
  });
};

AmqpDiscovery.prototype.requestServiceList = function (onServiceListReceived) {
  var _this = this
  this.broadcast.listenOnBroadcast("discovery-request", function (event, message) {
    var sendList
    try {
      if (message.name == "service-list") {
        if (sendList) clearTimeout(sendList)
        onServiceListReceived()
        _this.addFoundServices(message.list);
      } else if (_this.running) {
        //generate a random backoff. only emit if we haven't seen a service-list in the last couple of seconds
        setTimeout(function() {
          _this.broadcast.emit({
            name: "discovery-request",
            payload: {
              name: "service-list",
              list:_this.serviceList() }
          });
        }, 100)
      }
    } catch (err) {
      logger.warn("[*** DISCOVERY ***] Had issues parsing discovery response");
      logger.warn(err);
    }
  });

  setTimeout(function() {
    _this.broadcast.emit({
      name: "discovery-request",
      payload:{}
    });
  }, 100)
}

AmqpDiscovery.prototype.shutdown = function () {
  this.running = false;
  this.connection.close();
};

AmqpDiscovery.prototype.listenToServices = function () {
  var _this = this
  this.broadcast.listenOnBroadcast("discovery", function (event, message) {
    try {
      _this.addFoundServices([message]);
    } catch (err) {
      logger.warn("[*** DISCOVERY ***] Had issues parsing discovery response");
      logger.warn(err);
    }
  });
}

AmqpDiscovery.prototype.announce = function (svc) {
  var _this = this
  if (this.running && typeof this.broadcast !== 'undefined') {
    _this.broadcast.emit({
      name: "discovery",
      payload: svc
    });
  }
  ;
}

module.exports = AmqpDiscovery;
