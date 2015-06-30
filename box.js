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
	'none',
	'justify',
	'fill',
]);


var DisplayText = object({
	color: String,
	text: String,
	size: Number,
	lineHeight: Number,
});


var BoxContents = oneOf({
	image: String,
	text: DisplayText,
	boxes: object({
		gutter: Number,
		boxes: array(Box),
		expandWidth: ExpandWidth,
	}),
});


var Box = object({
	minDims: func([], Dimensions),
	dimensions: stream(Dimensions),
	align: Align,
	justify: Boolean,
	contents: BoxContents,
});

var box = type(
	func([], Box),
	function () {
		
	});
