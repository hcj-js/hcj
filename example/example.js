$(function () {
	var header = padding({
		all: 5,
	}, alignLRM({
		left: text('Left'),
		right: text('Right'),
		middle: text('Middle'),
	}));
	
	var message = text('Hello There');

	var page = stack({
		gutterSize: 10,
	}, [
		border(black, {
			bottom: 1,
		}, header),
		message,
		message,
		message,
	]);
	
	rootComponent(page);
});
