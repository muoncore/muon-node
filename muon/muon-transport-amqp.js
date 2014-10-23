

module.exports = function(overrideNucleus) {
    var nucleusUrl = globalNucleusUrl;

    if (overrideNucleus != null) {
        nucleusUrl = overrideNucleus;
    }
    console.log("Booting Muon Client Connection to " + nucleusUrl + "/ HTTP [" + nucleusHttpUrl + "]");

    var socket = io.connect(nucleusUrl);

    socket.on('connect', function () {
        console.log("muon socket connected");
    });
    socket.on('error', function () {
        console.log("balls ..");
    });
    socket.on('reconnect_failed', function () {
        console.log("reconnect_failed ..");
    });
    socket.on('disconnect', function () {
        console.log("disconnect ..");
    });

    socket.on('reconnecting', function () {
        console.log("reconnecting ..");
    });

    socket.on('reconnect_error', function (err) {
        console.log("reconnect_error ..");
        console.dir(err);
    });
    socket.on("nucleus", function(ev) {
        console.log("Muon Client Received Message!");
        for(var i = 0; i < callbacks.length; i++) {
            var c = callbacks[i];
            console.log("Checking the filter !");
            console.dir(c);
            if (messageMatchesQueryFilter(ev, c.filter)) {
                c.callback(ev);
            }
        }
    });

    return {
        on:function(filter, callback) {
            //socket.emit("query", filter);

            callbacks.push({
                filter:filter,
                callback:callback
            });
        },
        emit:function(event) {
            socket.emit("nucleus", event);
        },
        createResource : function(event) {
            event.action = "put";
            socket.emit("nucleus", event);
        },
        deleteResource : function(event) {
            event.action = "delete";
            socket.emit("nucleus", event);
        },
        shutdown:function() {
            socket.disconnect();
        },
        readNucleus:function(query, callback) {

            var success = function(actions) {
                console.log("Connected to nucleus and read resource data");
                console.dir(actions[0].response);
                callback(actions[0].response);
            };
            var failed = function(actions) {
                console.error("Failed to connect to nucleus and read resource data");
                console.dir(actions);
            };

            var urlPath = "/resource/" + query.resource;

            if (query.hasOwnProperty("recordId")) {
                urlPath += "/record/" + query.recordId;
            }
            if (query.hasOwnProperty("type")) {
                urlPath += "/type/" + query.type;
            }

            if (query.hasOwnProperty("query")) {
                urlPath += "?" + query.query.key + "=" + query.query.value;
            }

            msh.init(success, failed).get(nucleusHost, nucleusPort, urlPath).end();
        },
        getIp: function() {
            return nucleusHost
        },
        getPort: function() {
            return nucleusSocketPort
        },
        getHttpPort: function() {
            return nucleusPort
        }
    }
};

function messageMatchesQueryFilter(message, filter) {

    if (filter.hasOwnProperty("resource") && message.resource != filter.resource) {
        return false;
    }

    if (filter.hasOwnProperty("type") && message.type != filter.type) {
        return false;
    }
    if (filter.hasOwnProperty("action") && message.action != filter.action) {
        return false;
    }
    if (filter.hasOwnProperty("recordId") && message.recordId != filter.recordId) {
        return false;
    }
    //todo, json query string.

    return true;
}

