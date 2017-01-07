var _ = require("underscore");
var AmqpConnection = require('./infra/amqp-connection.js');
var Broadcast = require('./infra/amqp-broadcast.js');
require('sexylog');

var AmqpDiscovery = function (url) {
  this.url = url;
  this.running = false;
}

AmqpDiscovery.prototype.connect = function (onReady, addFoundService) {
  logger.debug("[*** DISCOVERY:BOOTSTRAP ***] AMQP Discovery is booting using URL " + this.url);
  this.connection = new AmqpConnection(this.url);

  this.addFoundService = addFoundService
  var _this = this;
  _this.connection.connect(function () {
    logger.info("[*** DISCOVERY:BOOTSTRAP ***] AMQP Discovery is ready!!");
    _this.broadcast = new Broadcast(_this.connection);
    _this.listenToServices()
    _this.running = true;
    onReady()
  });
};

AmqpDiscovery.prototype.shutdown = function () {
  this.running = false;
  this.connection.close();
};

AmqpDiscovery.prototype.listenToServices = function () {
  var _this = this
  this.broadcast.listenOnBroadcast("discovery", function (event, message) {
    try {
      _this.addFoundService(message);
    } catch (err) {
      logger.warn("[*** DISCOVERY ***] Had issues parsing discovery response");
      logger.warn(err);
    }
  });
}

AmqpDiscovery.prototype.announce = function (svc) {
  var _this = this
  if (this.running && typeof this.broadcast !== 'undefined') {
    logger.debug('[*** DISCOVERY ***] broadcasting discovery services: ' + JSON.stringify(svc));
    _this.broadcast.emit(svc);
  }
  ;
}

module.exports = AmqpDiscovery;
