var bichannel = require('../../../muon/infrastructure/channel');
var protocol = require('../../../muon/protocol/streaming/client-protocol');
var assert = require('assert');
var expect = require('expect.js');

describe("streaming client protocol", function () {

    it("sends subscribe when the protocol starts", function (done) {
        
        var transchannel = bichannel.create("transportchannel")
        
        
        proto.start()
        
        assert.fail("Not done")
    });

    it("on ACK, calls subscriber.onSubscribe", function (done) {
        assert.fail("Not done")
    });

    it("on NACK, calls onsubscriber.onSubscribe and then sub.error", function (done) {
        assert.fail("Not done")
    });

    it("on transport error, calls subscriber onSubscribe and sub.error", function (done) {
        assert.fail("Not done")
    });

    it("send CANCEL when sub calls cancel on stream control", function (done) {
        assert.fail("Not done")
    });

    it("sends REQUEST when the subscriber requests more data", function (done) {
        assert.fail("Not done")
    });

    it("on DATA received, calls sub onNext", function (done) {
        assert.fail("Not done")
    });

    it("on COMPLETE, calls sub onComplete", function (done) {
        assert.fail("Not done")
    });

    it("on ERROR, calls sub.onError", function (done) {
        assert.fail("Not done")
    });
});
