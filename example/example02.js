// We support ad-hoc polymorphic functions.


// Create a polymorphic function using 'poly()'.  Instance it for
// various types
var map = poly();

// map implementation for arrays
map.instance([array()], function (arr, f) {
	return arr.map(f);
});

// map implementation for promises
map.instance([promise()], function (p, f) {
	return p.then(f);
});

// map implementation for bacon streams
map.instance([stream()], function (s, f) {
	var result = new Bacon.Bus();
	s.onValue(function (v) {
		result.push(f(v));
	});
	return result;
});


// pass one argument to console.log
var log = function (str) {
	console.log(str);
};


var testArray = [1, 2, 3];
var testDeferred = $.Deferred();
var testStream = new Bacon.Bus();
map(testArray, log);
map(testDeferred, log);
map(testStream, log);

testDeferred.resolve('aoeu');
testStream.push('pushing to bus');
testStream.push('pushing to bus again');
