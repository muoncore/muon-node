var _ = require("underscore");
require('sexylog');

var BaseDiscovery = function (impl, frequency) {

  this.impl = impl
  if (!frequency) frequency = 3000; //broadcast frequency ms
  this.cacheFillTime = 5500;
  this.frequency = frequency;
  this.descriptors = [];

  var _this = this;

  _this.discoveryInitiated = false;
  _this.serviceList = []

  _this.clearCacheInterval = setInterval(function () {
    var now = new Date().getTime()
    _this.serviceList = _.filter(_this.serviceList, function (svc) {
      return (now - svc.time) < _this.cacheFillTime
    })
  }, 1000)

  setTimeout(function () {
    _this.discoveryInitiated = true
  }, 5000)

  this.discoveredServices = {
    find: function (name) {
      logger.trace("DISCOVERY: Searching for service " + name + " in list " + JSON.stringify(_this.serviceList))
      return _this.serviceList.find(function (svc) {
        return svc.identifier == name
      })
    },
    findServiceWithTags: function (tags) {
      var ret = _.find(_this.serviceList, function (svc) {
        var matchingTags = _.filter(svc.tags, function (tag) {
          return tags.indexOf(tag) >= 0
        })
        return matchingTags.length == tags.length
      })
      return ret
    },
    serviceList: function () {
      return _this.serviceList
    }
  }

  this.impl.connect(function () {
    startAnnouncements(_this)
  }, _this.addFoundService.bind(_this))
}

BaseDiscovery.prototype.addFoundService = function (svc) {
  var _this = this
  var service = _.findWhere(_this.serviceList, {"identifier": svc.identifier})
  if (!service) {
    service = svc
    _this.serviceList.push(service);
  }

  service.time = new Date().getTime()
}


BaseDiscovery.prototype.advertiseLocalService = function (serviceDescriptor) {
  this.descriptors.push(serviceDescriptor);
};

BaseDiscovery.prototype.discoverServices = function (callback) {
  var _this = this
  setTimeout(function () {
    if (_this.discoveryInitiated) {
      callback({
        find: _this.discoveredServices.find.bind(_this.discoveredServices),
        findServiceWithTags: _this.discoveredServices.findServiceWithTags.bind(_this.discoveredServices),
        serviceList: _this.discoveredServices.serviceList()
      });
    } else {
      var interval = setInterval(function () {
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

BaseDiscovery.prototype.close = function () {
  logger.debug("[*** DISCOVERY:SHUTDOWN ***] closing connections...");
  this.shutdown();
};

BaseDiscovery.prototype.shutdown = function () {
  this.stopAnnounce()
  clearInterval(this.clearCacheInterval)
  this.impl.shutdown()
};

BaseDiscovery.prototype.stopAnnounce = function () {
  clearInterval(this.announceInterval);
}

function startAnnouncements(discovery) {
  _.each(discovery.descriptors, function (it) {
    discovery.impl.announce(
      {
        name: "discovery",
        payload: it
      });
  });

  this.announceInterval = setInterval(function () {
    _.each(discovery.descriptors, function (response) {
      var discMsg = {
        name: "discovery",
        payload: response
      };
      logger.debug('[*** DISCOVERY ***] broadcasting discovery services: ' + JSON.stringify(discMsg));
      discovery.impl.announce(discMsg);
    });
  }, discovery.frequency);
}


module.exports = BaseDiscovery
