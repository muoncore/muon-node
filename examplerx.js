var Rx = require('rx');

var ob;

var source = Rx.Observable.create(function (observer) {
    // Note that this is optional, you do not have to return this if you require no cleanup
    ob = observer;
    return function () {
        console.log('disposed');
    };
});

source = source.controlled();

var subscription;
subscription = source.subscribeOnNext(
    function (x) {
        console.log('Next: ' + x);
    });

source.request(3);


// => Next: 42
// => Completed

setTimeout(function() {
    ob.onNext(42);
    ob.onNext(42);
    ob.onNext(42);
    ob.onNext(42);
    ob.onNext(42);
    ob.onNext(42);
    ob.onNext(42);
    ob.onNext(42);
    ob.onNext(42);
    ob.onNext(42);
    ob.onCompleted();
}, 1000);
