define([], function () {
	var Bus = {
		create: function (end) {
			end = end || function () {};
			var listeners = [];
			var bus = {
				stream: {
					map: function (f) {
						var i = listeners.length;
						var b = Bus.create(function () {
							listeners[i] = false;
						});
						listeners.push(function (v) {
							b.push(f(v));
						});
						return b.stream;
					},
					onValue: function (f) {
						var stream = this.map(f);
						return stream.end;
					},
					end: function () {
						end();
					},
				},
				push: function (v) {
					listeners.map(function (f) {
						f(v);
					});
				},
			};
		},
		once: function (v) {
			var bus = this.create();
			bus.push(v);
			return bus;
		},
	};
	return Bus;
});
