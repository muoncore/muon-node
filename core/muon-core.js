var uuid = require('node-uuid');
var _ = require("underscore");
var signals = require("signals");
var EventLogger = require("./introspection/eventlogger");
var IntrospectionResources = require("./introspection/introspection-resources");

var MuonCore = function (serviceIdentifier, discoveryService, tags) {

    var _this = this;
    this.tags = tags;
    this.discoveryService = discoveryService;
    this.transports = [];
    this.serviceIdentifier = serviceIdentifier;
    this.ready = new signals.Signal();
    this.isReady = false;
    this.introspection = new IntrospectionResources(this);
    this.eventLogger = new EventLogger(this);

    setTimeout(function () {
        _this.isReady = true;
        _this.ready.dispatch();
        _this.introspection.startup();
    }, 4000);
};

MuonCore.prototype.generateDescriptor = function () {
    return {
        "identifier": this.serviceIdentifier,
        "tags": this.tags,

        "resourceConnections": _.collect(
            _.filter(this.transports, function (it) {
                return !!("resource" in it);
            }), function (it) {
                return it.getUrl();
            }),

        "stream": _.collect(
            _.filter(this.transports, function (it) {
                return !!("stream" in it);
            }), function (it) {
                return it.getUrl();
            })
    };
};

MuonCore.prototype.readyWait = function (callback) {
    if (this.isReady) {
        callback();
    } else {
        this.ready.add(callback);
    }
};
MuonCore.prototype.onReady = function (callback) {
    this.readyWait(callback);
};
MuonCore.prototype.addTransport = function (transport) {
    //todo, verify the transport.
    //var transport = module.transports[0];
    var _this = this;
    transport.setServiceIdentifier(this.serviceIdentifier);
    this.transports.push(transport);
    this.discoveryService.clearAnnouncements();
    this.discoveryService.announceService(this.generateDescriptor());
    this.readyWait(function() {
        transport.setEventLogger(_this.eventLogger);
    });
};

MuonCore.prototype.on = function (event, callback) {
    this._listenOnBroadcast(event, callback);
};
MuonCore.prototype.emit = function (eventName, headers, payload) {
    //var transport = module.transports[0];
    if (headers == null) {
        headers = {"Content-Type": "application/json"};
    }
    this._emit({
        name: eventName,
        headers: headers,
        payload: payload
    });
};

MuonCore.prototype.onQuery = function (resource, callback) {
    this.introspection.addQuery(resource);
    this._listenOnResource(resource, "query", callback);
};
MuonCore.prototype.onCommand = function (resource, callback) {
    this.introspection.addCommand(resource);
    this._listenOnResource(resource, "command", callback);
};
MuonCore.prototype.query = function (url, callback, resource) {
    resource = resource || {};
    this._sendAndWaitForReply({
        url: url,
        payload: resource,
        method: "query"
    }, callback);
};
MuonCore.prototype.command = function (url, payload, callback) {
    this._sendAndWaitForReply({
        url: url,
        payload: payload,
        method: "command"
    }, callback);
};
MuonCore.prototype.subscribe = function (streamUri, callback) {
    this.checkReady();
    //TODO, transport discovery
    this.transports[0].subscribe(streamUri, callback);
};

MuonCore.prototype.discoverServices = function (callback) {
    this.checkReady();
    this.discoveryService.discoverServices(callback);
};


MuonCore.prototype._listenOnBroadcast = function (event, callback) {
    var _this = this;
    this.readyWait(function () {
        var transports = _this.transports;

        for (var i = 0; i < transports.length; i++) {
            var transport = transports[i];
            transport.broadcast.listenOnBroadcast(event, callback);
        }
    });
};

MuonCore.prototype._emit = function (payload) {
    var _this = this;
    this.readyWait(function () {
        var transports = _this.transports;

        for (var i = 0; i < transports.length; i++) {
            var transport = transports[i];
            transport.broadcast.emit(payload);
        }
    });
};

MuonCore.prototype._listenOnResource = function (resource, method, callback) {
    var _this = this;
    this.readyWait(function () {
        var transports = _this.transports;
        for (var i = 0; i < transports.length; i++) {
            var transport = transports[i];
            transport.resources.listenOnResource(resource, method, callback);
        }
    });
};

MuonCore.prototype._sendAndWaitForReply = function (payload, callback) {
    var _this = this;
    this.readyWait(function () {
        //TOD, pick the 'best' transport and only send on that one.
        var transports = _this.transports;
        for (var i = 0; i < _this.transports.length; i++) {
            var transport = _this.transports[i];
            transport.resources.sendAndWaitForReply(payload, callback);
        }
    });
};

MuonCore.prototype.checkReady = function () {
    if (!this.isReady) {
        logger.error("Muon instance is not yet ready, and cannot be interacted with. Use onReady");
        throw new Error("Muon instance is not yet ready, and cannot be interacted with. Use onReady");
    }
};

module.exports = MuonCore;
