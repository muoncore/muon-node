var _ = require("underscore");
var AmqpConnection = require('./infra/amqp-connection.js');
var Broadcast = require('./infra/amqp-broadcast.js');
require('sexylog');

var AmqpDiscovery = function (url, frequency) {

    if (!frequency) frequency = 3000; //broadcast frequency ms
    this.cacheFillTime = 5500;
    this.frequency = frequency;
    this.descriptors = [];
    this.callbacks = [];

    var _this = this;

    logger.debug("[*** DISCOVERY:BOOTSTRAP ***] AMQP Discovery is booting using URL " + url);
    _this.discoveryInitiated = false;
    _this.connection = new AmqpConnection(url);
    _this.url = url;

    _this.connection.connect(function () {
        logger.info("[*** DISCOVERY:BOOTSTRAP ***] AMQP Discovery is ready!!");
        setTimeout(function() {
            logger.debug("Discovery is now Initialised and has a full cache. Discovery queries will now return")
            _this.discoveryInitiated = true;
        }, _this.cacheFillTime)
        _this.broadcast = new Broadcast(_this.connection);
        listenToServices(_this)
        startAnnouncements(_this)
    });

    _this.serviceList = []

    _this.addFoundService = function(svc) {
      var service = _.findWhere(_this.serviceList, {"identifier": svc.identifier})
      if (!service) {
        service = svc
        _this.serviceList.push(service);
      }

      service.time = new Date().getTime()
    }

    _this.clearCacheInterval = setInterval(function() {
      var now = new Date().getTime()
      _this.serviceList = _.filter(_this.serviceList, function(svc) {
        return (now - svc.time) < _this.cacheFillTime
      })
    }, 1000)

    this.discoveredServices = {
        find: function (name) {
            logger.trace("DISCOVERY:AMQP - Searching for service " + name + " in list " + JSON.stringify(_this.serviceList))
            return _this.serviceList.find(function(svc) {
                return svc.identifier == name
            })
        },
        findServiceWithTags: function (tags) {
            var ret = _.find(_this.serviceList, function(svc) {
                var matchingTags = _.filter(svc.tags, function(tag) {
                    return tags.indexOf(tag) >= 0
                })
                return matchingTags.length == tags.length
            })
          return ret
        },
        serviceList: function() {
          return _this.serviceList
        }
    };
};


AmqpDiscovery.prototype.advertiseLocalService = function (serviceDescriptor) {
    this.descriptors.push(serviceDescriptor);
};
AmqpDiscovery.prototype.clearAnnouncements = function () {
    this.descriptors = [];
};

AmqpDiscovery.prototype.discoverServices = function (callback) {
    var _this = this
    setTimeout(function () {
        if (_this.discoveryInitiated) {
            callback({
              find: _this.discoveredServices.find.bind(_this.discoveredServices),
              findServiceWithTags: _this.discoveredServices.findServiceWithTags.bind(_this.discoveredServices),
              serviceList: _this.discoveredServices.serviceList()
            });
        } else {
            var interval = setInterval(function() {
                if (_this.discoveryInitiated) {
                    clearInterval(interval)
                    callback({
                      find: _this.discoveredServices.find.bind(_this.discoveredServices),
                      findServiceWithTags: _this.discoveredServices.findServiceWithTags.bind(_this.discoveredServices),
                      serviceList: _this.discoveredServices.serviceList()
                    });
                }
            }, 100)
        }
    }, 0);
};

AmqpDiscovery.prototype.close = function () {
    logger.debug("[*** DISCOVERY:SHUTDOWN ***] closing connections...");
    this.shutdown();
};

AmqpDiscovery.prototype.shutdown = function () {
  this.stopAnnounce()
  clearInterval(this.clearCacheInterval)
  this.connection.close();
};

function listenToServices(discovery) {
    discovery.broadcast.listenOnBroadcast("discovery", function (event, message) {
        try {
            discovery.addFoundService(message);
        } catch (err) {
            logger.warn("[*** DISCOVERY ***] Had issues parsing discovery response");
            logger.warn(err);
        }
    });
}

AmqpDiscovery.prototype.stopAnnounce = function() {
  clearInterval(this.announceInterval);
  this.broadcast.close()
}

function startAnnouncements(discovery) {
  discovery.announceInterval = setInterval(function () {
        if (typeof discovery.broadcast !== 'undefined') {
            clearInterval(discovery.announceInterval);

            _.each(discovery.descriptors, function (it) {
                discovery.broadcast.emit(
                    {
                        name: "discovery",
                        payload: it
                    });
            });

            setInterval(function () {
                _.each(discovery.descriptors, function (response) {
                    var discMsg = {
                        name: "discovery",
                        payload: response
                    };
                    logger.debug('[*** DISCOVERY ***] broadcasting discovery services: ' + JSON.stringify(discMsg));
                    discovery.broadcast.emit(discMsg);
                });
            }, discovery.frequency);
        }
    }, 0);
}

module.exports = AmqpDiscovery;
