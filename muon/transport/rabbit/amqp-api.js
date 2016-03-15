var amqp = require('amqplib/callback_api');
var RSVP = require('rsvp');
var bichannel = require('../../../muon/infrastructure/channel.js');
require('sexylog');
var helper = require('./transport-helper.js');


var queueSettings = {
     durable: false,
     type: "direct",
     autoDelete: true,
     confirm: true
   };

exports.connect = function(url, callback) {
    logger.info("[*** TRANSPORT:AMQP:BOOTSTRAP ***] connecting to amqp " + url);
    amqp.connect(url, function(err, amqpConnection) {

        if (err) {
            logger.error("[*** TRANSPORT:AMQP:BOOTSTRAP ***] error connecting to amqp service: " + err);
            callback(err, null);
        } else {
          logger.debug("[*** TRANSPORT:AMQP:BOOTSTRAP ***] amqp connected.");
           handleConnectionEvents(amqpConnection);
          var amqpChannel;
          amqpConnection.createChannel(onChannel);

          function onChannel(err, ch) {
            if (err != null) bail(err);
            amqpChannel = ch;
            handleChannelEvents(amqpChannel);
            var amqpApi = {
                  publish: function(queueName, payload, headers) {
                      publish(amqpChannel, queueName, payload, headers);
                  },
                  consume: function(queueName, callback) {
                     consume(amqpChannel, queueName, callback);
                  },
                  shutdown: function() {
                      amqpConnection.close();
                  }
            }
            callback(null, amqpApi);
          }
        }
    });
}


function handleConnectionEvents(amqpConnection) {
      amqpConnection.on('close', function(err) {
            logger.info('amqp connection closed ' + err);
      });

      amqpConnection.on('error', function(err) {
             logger.error('amqp connection error ' + err);
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
      });

      amqpChannel.on('error', function(err) {
            logger.error('amqp channel error ' + err);
      });

      amqpChannel.on('return', function(err) {
            logger.warn('amqp channel return ' + err);
      });

      amqpChannel.on('drain', function(err) {
            logger.warn('amqp channel drain ' + err);
      });
}

function publish(amqpChannel, queueName, payload, headers) {
    logger.trace("[*** TRANSPORT:AMQP:OUTBOUND ***] publish on queue " + queueName + " payload: ", JSON.stringify(payload));
    logger.trace("[*** TRANSPORT:AMQP:OUTBOUND ***] publish on queue " + queueName + " headers: ", JSON.stringify(headers));
    amqpChannel.assertQueue(queueName, queueSettings);
    amqpChannel.sendToQueue(queueName, new Buffer(JSON.stringify(payload)), {persistent: false, headers: headers});

}

function consume(amqpChannel, queueName, callback) {
   amqpChannel.assertQueue(queueName, queueSettings);
   amqpChannel.consume(queueName, function(msg) {
     if (msg !== null) {
       var payload = JSON.parse(msg.content.toString());
       logger.trace("[*** TRANSPORT:AMQP:OUTBOUND ***] consumed message on queue " + queueName + " content: " + JSON.stringify(payload));
       callback(null, payload);
       amqpChannel.ack(msg);
     } else {
        callback(new Error('error comsuing message on queue ' + queueName), null);
     }
   }, {noAck: false});

}

