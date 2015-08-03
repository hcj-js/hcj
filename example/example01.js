$(function () {
	var rootContext = type(Context, {
		$el: $('body'),
		position: Bacon.once({
			x: 0,
			y: 0,
		}),
		width: windowWidth(),
		height: Bacon.never(),
	});


	// var message = div();
	var message = div.all([
		$html('aoeuaoeuaoeu'),
	]);
	// message.minWidth.push(100);


	var body = message;

	body.create(rootContext);
});
