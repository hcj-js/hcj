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

var LineHeight = oneOf({
	px: Number,
	ratio: Number,
});

var DisplayText = object({
	color: String,
	text: String,
	size: Number,
	lineHeight: Number,
});


var BoxContents = oneOf({
	imageUrl: String,
	text: DisplayText,
	boxes: array(Box),
});


var Box = object({
	dimensions: stream(Dimensions),
	align: Align,
	justify: Boolean,
	contents: BoxContents,
});


var boxComponent = type(
	func(Box, Component),
	function (box) {
		return div;
	});
