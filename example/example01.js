$(function () {
	var message = div.all([
		$html('aoeuaoeuaoeu'),
	]);

	var addCs = new Bacon.Bus();
	
	var body = concat(addCs, Bacon.never());
	var i = body.create(rootContext());
	
	addCs.push(message);

	// i.destroy();
});
