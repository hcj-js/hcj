$(function () {
	var message = div.all([
		$html('aoeuaoeuaoeu'),
	]);

	var header = padding(10, lrmHeader({
		left: stack([
			div.all([
				$html('aoeu'),
			]),
			message,
		]),
		right: message,
		middle: message,
	})).all([
		$css('background-color', '#fff'),
	]);

	var part1 = grid({
		gutterSize: 10,
		minColumnWidth: 50,
	}, [message, message]);
	
	var messageCs = [];
	for (var i = 0; i < 50; i++) {
		messageCs.push(message);
	}
	var part2 = stack(messageCs);

	var body = stickyHeaderBody(message, header, part2);

	var content = fixedHeaderBody(header, body);

	var page = stack([content]);
	
	rootComponent(page);

	// i.destroy();
});
