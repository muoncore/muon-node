
require("sexylog");

var Muon = require("muon-core");
var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000

var serviceName = "browser-gateway";
var amqpurl = "amqp://muon:microservices@localhost";
var config = {
    discovery:{
        type:"amqp",
        url:amqpurl
    },
    transport:{
        type:"amqp",
        url:amqpurl
    }
};

var muon = Muon.create(serviceName, config);

app.use(express.static(__dirname + "/"))

var server = http.createServer(app)
server.listen(port)

console.log("http server listening on %d", port)


var wss = new WebSocketServer({server: server, path:"/discover"})
console.log("websocket server created")

wss.on("connection", function(ws) {
    //todo, tap the discovery and propogate to clients.
    //todo,enable filtering of which services are propogated.

    var interval = setInterval(function() {
        ws.send(JSON.stringify({
            identifier:"simples"
        }), function() {  })
    }, 2000);

    ws.on('message', function message(data, flags) {
        console.log("DUISCOVERY GOT DATA...." + JSON.stringify(data));

    });

    console.log("websocket discovery connection open")

    ws.on("close", function() {
        console.log("websocket connection close")
        clearInterval(interval);
    })
});

var transport = new WebSocketServer({server: server, path:"/transport"})
console.log("websocket trasport server created")

transport.on("connection", function(ws) {

    var connections = {};

    console.log("websocket transport connection open")

    //TODO, hook into a muon transport to forward messages to this.
    //todo, implement how to open/ close channels.
    //

    ws.onmessage = function(data) {
        console.log("Hello??");
    };

    ws.on('message', function message(data, flags) {
        var myData = JSON.parse(data);
        console.dir(myData);
        var channelId = myData.headers.channelId;
        var targetService = myData.headers.targetService;
        var protocol = myData.headers.PROTOCOL;
        myData.headers.sourceService = serviceName;

        var internalChannel = connections[channelId];

        if (internalChannel == undefined) {
            logger.debug("Establishing new channel to " + targetService + protocol);
            internalChannel = muon.getTransportClient().openChannel();
            connections[channelId] = internalChannel;
            internalChannel.leftConnection().listen(function(msg) {
                logger.debug("Sending message back down ws for channel " + channelId);
                msg.headers["channelId"] = channelId;
                ws.send(JSON.stringify(msg));
            });
        }

        console.log("Routing message on channel: " + channelId);
        internalChannel.leftConnection().send(myData);
    });

    ws.on("close", function() {
        console.log("websocket connection close")
    })
});
