var f = type(
	or([
		func(String, func([], String)),
		func(String, func([], Number)),
	]),
	function (str) {
		if (str === 'a') {
			return function () {
				return 'aoeu';
			};
		}
		else if(str === 'b') {
			return function () {
				return 32;
			};
		}
		else {
			return function () {
				return {};
			};
		}
	});


f('a')();
f('b')();
f('c')();
