
var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000

app.use(express.static(__dirname + "/"))

var server = http.createServer(app)
server.listen(port)

console.log("http server listening on %d", port)


var wss = new WebSocketServer({server: server, path:"/discover"})
console.log("websocket server created")

wss.on("connection", function(ws) {
    var id = setInterval(function() {
        ws.send(JSON.stringify({
            identifier:"simples"
        }), function() {  })
    }, 2000)

    ws.on('message', function message(data, flags) {
        console.log("DUISCOVERY GOT DATA....");

    });

    console.log("websocket discovery connection open")

    ws.on("close", function() {
        console.log("websocket connection close")
        clearInterval(id)
    })
})

var wss = new WebSocketServer({server: server, path:"/transport"})
console.log("websocket trasport server created")

wss.on("connection", function(ws) {
    console.log("websocket connection open")

    //TODO, hook into a muon transport to forward messages to this.
    //todo, implement how to open/ close channels.

    ws.on('message', function message(data, flags) {
        console.log("Received data from browser muon");

    });

    ws.on("close", function() {
        console.log("websocket connection close")
        clearInterval(id)
    })
})