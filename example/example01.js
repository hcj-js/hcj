// The 'type' function takes a type, and a value.  It makes sure the
// value is of the given type, and then returns the value.
var str = type(String, 'aoeu');
console.log(str);


// If there's a type error, this 'type' function logs a message to the
// console.  Additionally, it has a 'debugger' statement, so you can
// use the call stack to see where type errors happen.

// Here's a type error:
var str = type(String, 3);
console.log(str);


// Currently the only built-in types are String, Number, and Boolean.
// (Date is coming)
var str = type(String, 'aoeu');
var n = type(Number, 1.8);
var bool = type(Boolean, true);


// You can also build array, object, and function types.  The 'array'
// function takes a type, and returns the type of arrays of that type.
var goodArray = type(
	array(Number),
	[1, 2, 3]);

var badArray = type(
	array(Number),
	[1, 2, 'asoehucraoehusaerocuh']);


// The 'object' function is passed an object.  Keys are the keys that
// are expected on the object, and values are their expected types.
var Point = object({
	x: Number,
	y: Number,
});


var goodPoint = type(Point, {
	x: 8,
	y: 10,
});
var badPoint = type(Point, {
	x: 8,
});


// The 'func' function is useful, but a little tricky.  It takes two
// arguments, both optional.  By default, 'func' just returns the type
// of functions.
var f = type(func(), function () {});


// Suppose your function takes arguments and returns a value, and you
// want to specify and check the types of these each time the function
// is called.  This can be done with our existing tools:
var f = type(func(), function (str, n) {
	// make sure str is a String and n is a Number
	str = type(String, str);
	n = type(Number, n);

	// concatenate str and n - JavaScript should convert n to a String
	return type(String, str + n);
});

console.log(f('aoeu', 5));


// That looks kind of messy, though.  Purely for convenience, 'func'
// lets you pass in two optional arguments to check the value's
// arguments and return value each time it is called.
var f = type(
	func([String, Number], String),
	function (str, n) {
		return str + n;
	});

console.log(f('aoeu', 5));



// Putting this together, you can specify fairly complex data
// structures that you can verify at runtime.
var Structure = object({
	name: String,
	nested_structures: array(object({
		name: String,
		count: Number,
	})),
});

var instance = type(Structure, {
	name: 'asoeckrhaoserchk',
	nested_structures: [{
		name: ',.rshcaoesu',
		count: 15,
	}, {
		name: 'aoerskch',
		count: 832,
	}],
});
