var amqp = require('amqplib/callback_api');
var RSVP = require('rsvp');
var bichannel = require('../../../muon/infrastructure/channel.js');
require('sexylog');
var helper = require('./transport-helper.js');
var RSVP = require('rsvp');
var events = require('../../domain/events.js');



var queueSettings = {
     durable: false,
     type: "direct",
     autoDelete: true,
     confirm: true
};

var amqpConnectionOk = false;
var amqpChannelOk = false;


exports.connect = function(url) {

       var promise = new RSVP.Promise(function(resolve, reject) {
           function callback(err, amqpConnection, amqpChannel) {
                if (err) {
                    reject(err);
                } else {

                    var api = {
                          outbound: function(queueName) {
                            var clientChannel = bichannel.create("amqp-api-outbound-" + queueName);
                            clientChannel.rightConnection().listen(function(msg) {
                                 logger.trace('[*** TRANSPORT:AMQP-API:OUTBOUND ***] received outbound message: ' + JSON.stringify(msg));
                                 helper.validateMessage(msg);
                                 publish(amqpChannel, queueName, msg);
                            });
                            return clientChannel.leftConnection();
                          },
                          inbound: function(queueName) {
                            var clientChannel = bichannel.create("amqp-api-inbound-" + queueName);
                            consume(amqpChannel, queueName, function(err, msg) {
                                if (err) {
                                    logger.error('[*** TRANSPORT:AMQP-API:INBOUND ***] error consuming message from queue "' + queueName + '": ' + err);
                                } else {
                                    logger.trace('[*** TRANSPORT:AMQP-API:INBOUND ***] send message up stream: ' + JSON.stringify(msg));
                                    clientChannel.rightConnection().send(msg);
                                }
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
           amqpConnect(url, callback);
        });
        return promise;
}


function amqpConnect(url, callback) {

    logger.info("[*** TRANSPORT:AMQP-API:BOOTSTRAP ***] connecting to amqp " + url);
    amqp.connect(url, function(err, amqpConnection) {
        if (err) {
            logger.error("[*** TRANSPORT:AMQP-API:BOOTSTRAP ***] error connecting to amqp: " + err);
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
      amqpChannel.on('close', function(err) {
            logger.info('amqp channel close ' + err);
            amqpChannelOk = false;
      });

      amqpChannel.on('error', function(err) {
            logger.error('amqp channel error ' + err);
            //logger.error(new Error(err).stack);
            amqpChannelOk = false;
      });

      amqpChannel.on('return', function(err) {
            logger.warn('amqp channel return ' + err);
      });

      amqpChannel.on('drain', function(err) {
            logger.warn('amqp channel drain ' + err);
      });
}

function publish(amqpChannel, queueName, message) {
    var payload = message.payload;
    var headers = message.headers;
    logger.trace("[*** TRANSPORT:AMQP-API:OUTBOUND ***] publish on queue '" + queueName + "' payload: ", JSON.stringify(payload));
    logger.trace("[*** TRANSPORT:AMQP-API:OUTBOUND ***] publish on queue '" + queueName + "' headers: ", JSON.stringify(headers));
    amqpChannel.assertQueue(queueName, queueSettings);
    amqpChannel.sendToQueue(queueName, new Buffer(JSON.stringify(payload)), {persistent: false, headers: headers});

}

function consume(amqpChannel, queueName, callback) {
   amqpChannel.assertQueue(queueName, queueSettings);
   amqpChannel.consume(queueName, function(amqpMsg) {
     if (amqpMsg !== null) {
       var message = helper.demessage(amqpMsg);
       logger.debug("[*** TRANSPORT:AMQP-API:INBOUND ***] consumed message on queue " + queueName + " message.payload: " + JSON.stringify(message.payload));
       logger.trace("[*** TRANSPORT:AMQP-API:INBOUND ***] consumed message on queue " + queueName + " message.headers: " + JSON.stringify(message.message));
       logger.warn('[*** TRANSPORT:AMQP-API:INBOUND ***] raw incoming message: ');
       logger.warn(message);
       callback(null, message);
       amqpChannel.ack(amqpMsg);
     } else {
        callback(new Error('error consuming null message on queue ' + queueName), null);
     }
   }, {noAck: false});

}

