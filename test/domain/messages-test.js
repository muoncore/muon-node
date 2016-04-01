var muoncore = require('../../muon/api/muoncore.js');
var assert = require('assert');
var expect = require('expect.js');
var messages = require('../../muon/domain/messages.js');
var muon;
var muon2;

describe("event domain test", function () {


    it("create rpc message with valid headers", function (done) {
          var msg = messages.rpcMessage("PING", 'testclient', 'muon://testserver/ping');
          console.log('valid message: ');
          console.dir(msg);
          assert.equal(msg.payload, 'PING');
          assert.equal(msg.headers.origin_service, 'testclient');
          assert.equal(msg.headers.target_service, 'testserver');
          assert.equal(msg.headers.url, 'muon://testserver/ping');
          done();
    });



    it("create wire message string payload", function (done) {


          var amqpMsg = amqpMessage('PING');
          var message = messages.fromWire(amqpMsg);
          console.log('valid message: ');
          console.dir(message);
          assert.equal(message.payload, 'PING');
          done();
    });

    it("create wire message object payload", function (done) {
          var amqpMsg = amqpMessage({text: 'PING'});
          var message = messages.fromWire(amqpMsg);
          console.log('valid message: ');
          console.dir(message);
          assert.equal(message.payload.text, 'PING');
          done();
    });

    it("copy message", function (done) {
          var amqpMsg = amqpMessage({text: 'PING'});
          var message = messages.fromWire(amqpMsg);
          var messageCopy = messages.copy(message);
          assert.deepEqual(message, messageCopy);
          done();
    });

    it("is handshake accept message", function (done) {
          var handshake = messages.handshakeAccept();
          assert.ok(messages.isHandshakeAccept(handshake));
          done();
    });

    it("is handshake message", function (done) {
          var handshake = messages.handshakeAccept();
          assert.ok(messages.isHandshake(handshake));
          done();
    });


    it("test message validation", function (done) {
          var msg =     {
                id: '696f4064-2cc5-44c2-a4dd-6c61bdb1e799',
                created: new Date(),
                headers:
                 { origin_id: '696f4064-2cc5-44c2-a4dd-6c61bdb1e799',
                   event_type: 'request.made',
                   protocol: 'request',
                   target_service: 'server1',
                   origin_service: 'client1',
                   url: 'muon://server1/ping',
                   channel_op: 'NORMAL',
                   content_type: 'application/json',
                   content_types: [ 'application/json' ] },
                payload: 'PING'
          };

          var response = messages.validate(msg);
          assert(response);
          done();
    });


    it("creating message with invalid headers throws exception", function (done) {
          try {
            var msg = messages.rpcMessage("PING", 'testclient', '', '');
          }
          catch(err) {
            //logger.error(err);
            //logger.error(err.stack);
            expect(err).not.to.be(undefined);
            expect(err.message).to.contain('Error! problem validating rpc message schema');
          }
          done();
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
                  origin_id: 'd3a6b9d2-c09d-4561-9b11-bf7cd0dbd0ee',
                  event_type: 'request.made',
                  protocol: 'request',
                  target_service: 'testserver',
                  origin_service: 'testclient',
                  url: 'muon://testserver/ping',
                  channel_op: 'normal',
                  content_type: 'application/json',
                  content_types: ['application/json']
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
