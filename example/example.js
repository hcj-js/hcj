$(function () {
	var message = div.all([
		$html('aoeuaoeuaoeu'),
		$css('text-align', 'center'),
	]);

	var borderConfig = {
		bottom: 1,
	};

	var header = border('black', borderConfig, padding(10, lrmHeader({
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
	]));

	var messageCs = [];
	for (var i = 0; i < 20; i++) {
		messageCs.push(message);
	}

	var part1 = border('black', borderConfig, grid({
		gutterSize: 10,
		outerGutter: true,
		minColumnWidth: 50,
		splitSurplus: true,
	}, messageCs));
	
	var part2 = stack(messageCs.concat(messageCs));

	var body = stickyHeaderBody(part1, header, part2);

	var content = fixedHeaderBody(header, body);

	var page = stack([content]);
	
	rootComponent(page);

	// i.destroy();
});
