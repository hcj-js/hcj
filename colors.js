var applyColorJquery = function ($el, color, noise) {
	if (noise) {
		$el.css('background-image', url(color.noiseSrc));
		$el.css('color', color.text);
	}
	else {
		$el.css('background-color', color.background);
		$el.css('color', color.text);
	}
};

var applyColor = function (color, noise) {
	if (noise) {
		return all([
			$css('background-image', url(color.noiseSrc)),
			$css('color', color.text),
		]);
	}
	else {
		return all([
			$css('background-color', color.background),
			$css('color', color.text),
		]);
	}
};


var white = {
	background: '#fff',
	text: 'black',
};

var black = {
	background: '#000',
	text: 'white',
};
