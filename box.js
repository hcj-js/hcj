var Dimensions = object({
	width: Number,
	height: Number,
});

var Box = object({
	width: func(Number),
	height: func(Number),
	dimensions: stream(Dimensions),
});

var box = type(
	func([], Box),
	function () {
		
	});
