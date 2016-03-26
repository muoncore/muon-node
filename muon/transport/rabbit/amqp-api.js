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
                                 logger.trace('[*** TRANSPORT:AMQP-API:OUTBOUND ***] received message from amqp-api client: ' + JSON.stringify(msg));
                                 publish(amqpChannel, queueName, msg, msg.headers);
                            });
                            return clientChannel.leftConnection();
                          },
                          inbound: function(queueName) {
                            var clientChannel = bichannel.create("amqp-api-intbound-" + queueName);
                            consume(amqpChannel, queueName, function(err, msg) {
                                if (err) {
                                    logger.error('[*** TRANSPORT:AMQP-API:INBOUND ***] error consuming message from queue "' + queueName + '": ' + err);
                                } else {
                                    logger.trace('[*** TRANSPORT:AMQP-API:INBOUND ***] sending message to amqp-api client: ' + JSON.stringify(msg));
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
            amqpChannelOk = false;
      });

      amqpChannel.on('return', function(err) {
            logger.warn('amqp channel return ' + err);
      });

      amqpChannel.on('drain', function(err) {
            logger.warn('amqp channel drain ' + err);
      });
}

function publish(amqpChannel, queueName, payload, headers) {
    logger.trace("[*** TRANSPORT:AMQP-API:OUTBOUND ***] publish on queue " + queueName + " payload: ", JSON.stringify(payload));
    logger.trace("[*** TRANSPORT:AMQP-API:OUTBOUND ***] publish on queue " + queueName + " headers: ", JSON.stringify(headers));
    amqpChannel.assertQueue(queueName, queueSettings);
    amqpChannel.sendToQueue(queueName, new Buffer(JSON.stringify(payload)), {persistent: false, headers: headers});

}

function consume(amqpChannel, queueName, callback) {
   amqpChannel.assertQueue(queueName, queueSettings);
   amqpChannel.consume(queueName, function(msg) {
     if (msg !== null) {
       var msgContent = msg.content.toString();
       if (! msgContent || msgContent == undefined || msgContent == null || msgContent == '') {
         msgContent = "{}";
       }
       var payload = JSON.parse(msgContent);
       payload.created = new Date();
       logger.trace("[*** TRANSPORT:AMQP-API:INBOUND ***] consumed message on queue " + queueName + " payload: " + JSON.stringify(payload));
       var headers = msg.properties.headers;
       //var headers = JSON.parse(msg.properties.headers.toString());
       logger.trace("[*** TRANSPORT:AMQP-API:INBOUND ***] consumed message on queue " + queueName + " headers: " + JSON.stringify(headers));
       payload.headers = headers;
       logger.warn('[*** TRANSPORT:SERVER:HANDSHAKE ***] raw incoming message: ');
       logger.warn(payload);
       callback(null, payload);
       amqpChannel.ack(msg);
     } else {
        callback(new Error('error consuming null message on queue ' + queueName), null);
     }
   }, {noAck: false});

}

