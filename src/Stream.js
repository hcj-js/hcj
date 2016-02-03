define([
	'Bus',
], function (Bus) {
	return {
		create: function () {
			var b = Bus.create();
			return b.stream;
		},
		once: function (v) {
			var b = Bus.once(v);
			return b.stream;
		}
	};
});
