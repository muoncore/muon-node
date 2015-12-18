var amqp = require('amqplib/callback_api');
require('sexylog');



module.exports.connect = function(url, queue, cspchannel) {
    logger.trace('create amqp connection url=' + url);

      var connection;
        var amqpChannel;
         amqp.connect(url, function(err, conn) {
            if (err) {
                 logger.error(err);
            } else {
                logger.debug('amqp connection created successfully: ' + url);
                connection = conn;
            }

             connection.createChannel(function(err, ch) {
                    logger.debug('create queue ' + queue);
                     amqpChannel = ch;
                     amqpChannel.assertQueue(queue, {durable: false});

                     logger.debug('listening for message on csp-channel');
                     cspchannel.listen(function(msg) {
                          logger.debug("sending amqp message " + JSON.stringify(msg) );
                          amqpChannel.sendToQueue(queue, new Buffer(msg));
                     });

                     amqpChannel.consume(queue, function(msg) {
                           logger.debug("received amqp message from queue'" + queue + "': " + msg.content.toString());
                           cspchannel.send(msg.content.toString());
                     }, {noAck: true});
               });
          });

         return {
            close: function() {
                cspchannel.close();
                connection.close();
            },
            status: function() {
                return "ok";
            }
         }
}


/*





*/