var Dimensions = object({
	width: Number,
	height: Number,
});

var Align = enumeration([
	'left',
	'right',
	'center',
]);

var ExpandWidth = enumeration([
]);


var Box = object({
	minDims: func([], Dimensions),
	dimensions: stream(Dimensions),
	align: Align,
	justify: Boolean,
	contents: array(Box),
});

var box = type(
	func([], Box),
	function () {
		
	});
