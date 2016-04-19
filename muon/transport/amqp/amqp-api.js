var amqp = require('amqplib/callback_api');
var RSVP = require('rsvp');
var bichannel = require('../../../muon/infrastructure/channel.js');
require('sexylog');
var RSVP = require('rsvp');
var messages = require('../../domain/messages.js');
var nodeUrl = require('url');
var helper = require('./transport-helper.js');


var queueSettings = {
     durable: false,
     type: "direct",
     autoDelete: true,
     confirm: true
};




var amqpConnectionOk = false;
var amqpChannelOk = false;

function validateUrl(url) {
        try {
            var parsedUrl = nodeUrl.parse(url);
        } catch (err) {
            return new Error('invalid ampq url: ' + url);
        }

       if (parsedUrl.protocol != 'amqp:') return new Error('invalid ampq url: ' + url);
       if (! parsedUrl.slashes) return new Error('invalid ampq url: ' + url);
       if (! parsedUrl.hostname) return new Error('invalid ampq url: ' + url);
       return;
}

exports.connect = function(url) {

       var channelValidator = function(msg) {
            helper.validateMessage(msg);
       }

       var promise = new RSVP.Promise(function(resolve, reject) {
           function callback(err, amqpConnection, amqpChannel) {
                if (err) {
                    logger.error('error connecting to amqp' + err);
                    reject(err);
                } else {
                    var api = {
                          outbound: function(queueName) {
                            var clientChannel = bichannel.create("amqp-api-outbound-" + queueName, channelValidator);
                            clientChannel.rightConnection().listen(function(msg) {
                                 logger.trace('[*** TRANSPORT:AMQP-API:OUTBOUND ***] received outbound message: ', msg);
                                 publish(amqpChannel, queueName, msg);
                            });
                            return clientChannel.leftConnection();
                          },
                          inbound: function(queueName) {
                            var clientChannel = bichannel.create("amqp-api-inbound-" + queueName, channelValidator);
                            consume(amqpChannel, queueName, function(msg) {
                                    logger.trace('[*** TRANSPORT:AMQP-API:INBOUND ***] send message up stream: ', msg);
                                    clientChannel.rightConnection().send(msg);
                            });
                            return clientChannel.leftConnection();
                          },
                          shutdown: function() {
                              amqpConnection.close();
                          }
                    }
                    resolve(api);
                }
           }
           var invalid = validateUrl(url);
           if (invalid) reject(invalid);
           amqpConnect(url, callback);
        });
        return promise;
}


function amqpConnect(url, callback) {

    logger.info("[*** TRANSPORT:AMQP-API:BOOTSTRAP ***] connecting to amqp " + url);
    amqp.connect(url, function(err, amqpConnection) {
        if (err) {
            logger.error("[*** TRANSPORT:AMQP-API:BOOTSTRAP ***] error connecting to amqp: " + err);
            logger.error(err.stack);
            callback(err);
        } else {
          amqpConnectionOk = true;
          logger.debug("[*** TRANSPORT:AMQP-API:BOOTSTRAP ***] amqp connected.");
          handleConnectionEvents(amqpConnection);
          amqpConnection.createChannel(onChannel);
          function onChannel(err, amqpChannel) {
            if (err != null) {
                logger.error("[*** TRANSPORT:AMQP-API:BOOTSTRAP ***] error creating amqp channel: " + err);
                callback(err);
            } else {
                amqpChannelOk = true;
                logger.trace("[*** TRANSPORT:AMQP-API:BOOTSTRAP ***] amqp comms channel created successfully");
                handleChannelEvents(amqpChannel);
                callback(null, amqpConnection, amqpChannel);
            }

          }
        }
    });
}

function handleConnectionEvents(amqpConnection) {
      amqpConnection.on('close', function(err) {
            logger.info('amqp connection closed ' + err);
            amqpConnectionOk = false;
      });

      amqpConnection.on('error', function(err) {
             logger.error('amqp connection error ' + err);
             logger.error(err.stack);
             amqpConnectionOk = false;
      });

      amqpConnection.on('blocked', function(err) {
            logger.warn('amqp connection blocked ' + err);
      });

      amqpConnection.on('unblocked', function(err) {
            logger.warn('amqp connection unblocked ' + err);
      });
}

function handleChannelEvents(amqpChannel) {
      amqpChannel.on('close', function() {
            logger.info('amqp channel event fired on close');
            amqpChannelOk = false;
      });

      amqpChannel.on('error', function(err) {
            logger.error('amqp channel event fired on error. error=' + err);
            logger.error(err.stack);
            amqpChannelOk = false;
      });

      amqpChannel.on('return', function() {
            logger.warn('amqp channel event fired on return');
      });

      amqpChannel.on('drain', function() {
            logger.warn('amqp channel event fired on drain');
      });
}

function publish(amqpChannel, queueName, message) {
    var data = message.data;
    var headers = message.headers;
    logger.trace("[*** TRANSPORT:AMQP-API:OUTBOUND ***] publish on queue '" + queueName + "' data: ", data);
    logger.trace("[*** TRANSPORT:AMQP-API:OUTBOUND ***] publish on queue '" + queueName + "' headers: ", headers);
    amqpChannel.assertQueue(queueName, queueSettings);
    var buffer = helper.encode(data);
    //console.dir(buffer);
    amqpChannel.sendToQueue(queueName, new Buffer(buffer), {persistent: false, headers: headers});

}

function consume(amqpChannel, queueName, callback) {
   amqpChannel.assertQueue(queueName, queueSettings);
   amqpChannel.consume(queueName, function(amqpMsg) {
       var message = helper.fromWire(amqpMsg);
       logger.debug("[*** TRANSPORT:AMQP-API:INBOUND ***] consumed message on queue " + queueName + " message.data: ", message.data);
       logger.trace("[*** TRANSPORT:AMQP-API:INBOUND ***] consumed message on queue " + queueName + " message.headers: ", message.headers);
       logger.trace('[*** TRANSPORT:AMQP-API:INBOUND ***] raw incoming message: ');
       logger.trace(message);
       callback(message);
       amqpChannel.ack(amqpMsg);
   }, {noAck: false});

}

