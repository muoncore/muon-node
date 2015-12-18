var amqp = require('amqplib/callback_api');
var Promise = require('es6-promise').Promise;
//var Q = require('q');
var bichannel = require('../../../muon/channel/bi-channel.js');
require('sexylog');





var amqpConnection;

module.exports.connect = function(url, callback) {

    var transportConnector = {
        openChannel: function(service) {
            return openChannel(service);
        },
        close: function() {
            amqpConnection.close(); // is this right?
        },
        status: function() {
            return "ok";
        }
     }

     amqp.connect(url, function(err, conn) {
            logger.trace("amqp connection iniitaiton done...");
            if (err) {
                 logger.error(err);
                 callback();
            } else {
                logger.debug('amqp connection created successfully: ' + url);
                amqpConnection = conn;
                callback(transportConnector);
            }
      });
}




module.exports.openChannel = function(service, callback) {

        var channel = bichannel.create(service);
           var clientConnection = channel.left();
           var localConnection = channel.right();
           var queue = "service." + service;

          amqpConnection.createChannel(function(err, ch) {
                  amqpChannel = ch;
                  var created = amqpChannel.assertQueue(queue, {durable: false});
                  logger.trace('created queue ' + queue);

                  localConnection.listen(function(msg) {
                       logger.debug("received csp channel message, forwarding to amqp: " + JSON.stringify(msg) );
                       amqpChannel.sendToQueue(queue, new Buffer(msg));
                  });

                  amqpChannel.consume(queue, function(msg) {
                        logger.debug("received amqp message from queue'" + queue + "' forwarding to csp channel: " + msg.content.toString());
                        localConnection.send(msg.content.toString());
                  }, {noAck: true});

                   if (err) {
                         // hand back client end of csp-channel
                          callback(err);
                   } else {
                          callback(clientConnection);

                   }

           });
}










