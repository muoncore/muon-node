var helper = require('../../../muon/transport/amqp/transport-helper.js');
var assert = require('assert');
var expect = require('expect.js');



describe("transport helper test", function () {



      after(function() {
            //bi-channel.closeAll();
      });

    it("create handshake request headers", function () {
        var headers = helper.handshakeRequestHeaders("rpc", "listenq", "replyq");
        assert.equal("listenq", headers.server_listen_q);
        assert.equal("replyq", headers.server_reply_q);
        assert.equal("rpc", headers.protocol);
        assert.equal("initiated", headers.handshake);
    });

    it("create handshake accept headers", function () {
        var headers = helper.handshakeAcceptHeaders();
        assert.equal("accepted", headers.handshake);
    });

    it("create string from wire message payload", function (done) {

          var amqpMsg = amqpMessage('PING');
          var message = helper.fromWire(amqpMsg);
          console.log('valid message: ');
          console.dir(message);
          assert.equal(message.data, 'PING');
          assert.equal(message.headers.protocol, 'rpc');
          done();
    });

    it("create object from wire message payload", function (done) {
          var amqpMsg = amqpMessage({text: 'PING'});
          var message = helper.fromWire(amqpMsg);
          console.log('valid message: ');
          console.dir(message);
          assert.equal(message.data.text, 'PING');
          done();
    });

    it("validate handshake message", function (done) {
          var handshake = {
            headers: {
                 protocol: 'rpc',
                 handshake: 'initiated',
                 server_reply_q: 'server.reply.ABCDEF-1234567890',
                 server_listen_q: 'server.listen.ABCDEF-1234567890',
            },
            data: ''
          }
          var message = helper.validateMessage(handshake);
          done();
    });

    it("catch invalid handshake initiate message", function () {
          var handshake = {
            headers: {
                 protocol: 'rpc',
                 handshake: 'initiated',
                 server_reply_q: '',
                 server_listen_q: 'server.listen.ABCDEF-1234567890',
            },
            data: ''
          }
           expect(function() { helper.validateMessage(handshake) }).to.throwException(/ValidationError/);
    });

    it("catch invalid handshake listen queue name message", function () {
          var handshake = {
            headers: {
                 protocol: 'rpc',
                 handshake: 'initiated',
                 server_reply_q: 'server.reply',
                 server_listen_q: 'server.listen',
            },
            data: ''
          }
           expect(function() { helper.validateMessage(handshake) }).to.throwException("message\":\"\"server_reply_q\" with value \"server.reply\" fails to match the required pattern");
    });

    it("catch invalid handshake accept message", function () {
          var handshake = {
            headers: {
                 protocol: 'rpc',
                 handshake: 'uccepted',
            },
            data: ''
          }
           expect(function() { helper.validateMessage(handshake) }).to.throwException("fails to match the required pattern: /(initiated|accepted)/");
    });

    it("catch invalid data message", function () {
          var handshake = {
            headers: {
                 protocol: 'rpc',
                 content_type: "application/json"
            },
            payload: {}
          }
           expect(function() { helper.validateMessage(handshake) }).to.throwException("message\":\"\"data\" is required");
    });

    it("allow null data message", function () {
          var handshake = {
            headers: {
                 protocol: 'rpc',
                 content_type: "text/plain"
            },
            data: null
          }
          helper.validateMessage(handshake);
    });


});

function amqpMessage(payload) {
    if (typeof payload == 'object') payload = JSON.stringify(payload);
    var amqpMsg = {
        fields: {
               consumerTag: 'amq.ctag-wPIsYXkDgK6pc8Xbj2lKzA',
               deliveryTag: 1,
               redelivered: false,
               exchange: '',
               routingKey: 'api_test_queue' },
        properties: {
               contentType: undefined,
               contentEncoding: undefined,
               headers:  {
                  protocol: "rpc",
                  content_type: 'application/json',
               },
               deliveryMode: 1,
               priority: undefined,
               correlationId: undefined,
               replyTo: undefined,
               expiration: undefined,
               messageId: undefined,
               timestamp: undefined,
               type: undefined,
               userId: undefined,
               appId: undefined,
               clusterId: undefined
        },
        content:  new Buffer(payload)
    }

    return amqpMsg;

}
