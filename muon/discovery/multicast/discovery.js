var dgram = require('dgram');
var _ = require("underscore");
require('sexylog');

var MulticastDiscovery = function () {
  this.running = false;
}

MulticastDiscovery.prototype.connect = function (onReady, addFoundService) {
  logger.debug("[*** DISCOVERY:BOOTSTRAP ***] AMQP Discovery is booting using URL " + this.url);

  this.port = 9898
  this.address = "224.1.7.8"

  var _this = this
  this.addFoundService = addFoundService

  this.server = dgram.createSocket("udp4");
  this.client = dgram.createSocket({ type: 'udp4', reuseAddr: true });

  this.server.bind(function () {
    _this.server.setBroadcast(true)
    _this.server.setMulticastTTL(128);
    _this.listenToServices()
    _this.running = true;
    console.log("RUNNING!")
    onReady()
  });
};

MulticastDiscovery.prototype.shutdown = function () {
  this.running = false;
  this.server.close()
};

MulticastDiscovery.prototype.listenToServices = function () {
  var _this = this
  _this.client.on('listening', function () {
    var address = _this.client.address();
    console.log('UDP Client listening on ' + address.address + ":" + address.port);
    _this.client.setBroadcast(true)
    _this.client.setMulticastTTL(128);
    _this.client.addMembership(_this.address);
  });

  _this.client.on('message', function (message, remote) {
    var svc = JSON.parse(message.toString())
    _this.addFoundService(svc)
  });

  this.client.bind(this.port);
}


MulticastDiscovery.prototype.announce = function (svc) {
  var _this = this
  if (this.running) {
    var message = new Buffer(JSON.stringify(svc));
    this.server.send(message, 0, message.length, this.port, this.address);
  }
}

module.exports = MulticastDiscovery;
