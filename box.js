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


var BoxContents = 


var Box = object({
	minDims: func([], Dimensions),
	dimensions: stream(Dimensions),
	align: Align,
	justify: Boolean,
	contents: or([
		array(Box),
		String,
	]),
});

var box = type(
	func([], Box),
	function () {
		
	});
