
module.io = null;

module.serverSocket = null;

module.resourceResponse = [];

exports.listen = function(port) {

    console.log("Booting Stub Nucleus on " + port);

    module.io = require('socket.io').listen(port);

    module.io.on('connection', function(socket){
        var theQuery = {};
        module.serverSocket = socket;
        console.log('a remote component connected to the test nucleus ' + socket.id);
        socket.on('disconnect', function(){
            console.log('component disconnected ' + socket.id);
        });
        socket.on('query', function(query){
            console.log('Component ' + socket.id + 'registered a notification filter');
            console.dir(query);
            theQuery = query;
        });
        socket.on("resource", function(args) {
            console.log("Muon/ Nucleus Received Resource Message");
            console.dir(args);
            //TODO, allow injection of the resource responses.
            module.io.sockets.emit("resource", module.resourceResponse);
        });
    });
};

exports.send = function(message) {
    console.log("Muon/ Nucleus sending a test message");
    module.io.sockets.emit('nucleus', message);
};

exports.on = function(call) {
    module.serverSocket.on("nucleus", function(args) {
        console.log("Muon/ Nucleus Received Message");
        console.dir(args);
        call(args);
    });
//    module.serverSocket.on("resource", function(args) {
//        console.log("Muon/ Nucleus Received Resource Message");
//        console.dir(args);
//        call(args);
//    });
};

exports.shutdown = function() {
    console.log("Closing Mock Muon");
    module.io.server.close();
    var socketlist = [];

    module.serverSocket.disconnect();
    console.log("Mock Muon Shutdown");
};

exports.onResourceQuery = function(expectedQuery, response) {
    module.resourceResponse = response;
};
