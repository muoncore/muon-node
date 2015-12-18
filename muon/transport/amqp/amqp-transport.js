var amqp = require('amqplib/callback_api');



module.exports.transport = function(url) {


        amqp.connect('amqp://muon:microservices@msg.cistechfutures.net', function(err, conn) {
                if (err) {
                     logger.error(err);
                } else {
                    logger.info('amqp connection created');
                    connection = conn;
                }

             connection.createChannel(function(err, ch) {
                     var q = 'hello';
                     ch.assertQueue(q, {durable: false});
                     ch.sendToQueue(q, new Buffer('Hello World!'));
                     logger.info(" [x] Sent 'Hello World!'");
                     logger.info(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
                     ch.consume(q, function(msg) {
                           logger.info(" [x] Received %s", msg.content.toString());
                            connection.close();
                           done();
                     }, {noAck: true});
               });
        });

}