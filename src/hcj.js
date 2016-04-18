var apply = function (v) {
	return function (f) {
		return f(v);
	};
};
var constant = function (b) {
	return function (a) {
		return b;
	};
};
var curry = function (arr) {
	throw('the venerable curry, we shall define at a later date');
};
var id = function (a) {
	return a;
};
var add = function (a, b) {
	return a + b;
};
var subtract = function (a, b) {
	return a - b;
};
var mathMax = function (a, b) {
	return Math.max(a, b);
};
var mathMin = function (a, b) {
	return Math.min(a, b);
};

var pushStreams = [];
var pushValues = [];
var pushing = false;
var pushFlush = function () {
	var ps = pushStreams;
	var pv = pushValues;
	pushStreams = [];
	pushValues = [];
	pushing = false;
	for (var j = 0; j < ps.length; j++) {
		var s = ps[j];
		var v = pv[j];
	}
};
var pushNow = function (s, v) {
	pushStreams.push(s);
	pushValues.push(v);
	if (pushing === false) {
		pushing = true;
		setTimeout(function () {
			setTimeout(pushFlush);
		});
	}
};

var stream = {
	create: function () {
		return {
			listeners: [],
			lastValue: undefined,
			ended: false,
		};
	},
	isStream: function (v) {
		return v &&
			v.hasOwnProperty('listeners') &&
			v.hasOwnProperty('lastValue') &&
			v.hasOwnProperty('ended');
	},
	once: function (v) {
		var s = stream.create();
		stream.push(s, v);
		return s;
	},
	push: function (s, v) {
		if (s.lastValue !== v) {
			s.lastValue = v;
			for (var i = 0; i < s.listeners.length; i++) {
				s.listeners[i](v);
			}
		}
	},
	map: function (s, f) {
		var out = stream.create();
		if (s.lastValue !== undefined) {
			stream.push(out, f(s.lastValue));
		}
		s.listeners.push(function (v) {
			stream.push(out, f(v));
		});
		return out;
	},
	reduce: function (s, f, v1) {
		var out = stream.once(v1);
		if (s.lastValue !== undefined) {
			stream.push(out, f(s.lastValue, out.lastValue));
		}
		s.listeners.push(function (v) {
			stream.push(out, f(v, out.lastValue));
		});
		return out;
	},
	filter: function (s, f) {
		var out = stream.create();
		s.listeners.push(function (v) {
			f(v, out.push);
		});
		return stream;
	},
	onValue: function (s, f) {
		return stream.map(s, function (v) {
			f(v);
			return true;
		});
	},
	promise: function (s) {
		var d = $.Deferred();
		stream.map(s, function (v) {
			d.resolve(v);
		});
		return d.promise;
	},
	prop: function (s, str) {
		return stream.map(s, function (v) {
			return v[str];
		});
	},
	delay: function (s, amount) {
		var out = stream.create();
		stream.map(s, function (v) {
			setTimeout(function () {
				stream.push(out, v);
			}, amount);
		});
		return out;
	},
	end: function (s) {
		s.ended = true;
	},
	pushAll: function (source, target) {
		if (source.lastValue !== undefined) {
			stream.push(target, source.lastValue);
		}
		stream.onValue(source, function (v) {
			stream.push(target, v);
		});
	},
	combine: function (streams, f) {
		var arr = [];
		var out = stream.create();

		var running = false;
		var err = new Error();
		var tryRunF = function () {
			if (!running) {
				running = true;
				setTimeout(function () {
					err;
					running = false;
					for (var i = 0; i < streams.length; i++) {
						if (arr[i] === undefined) {
							return;
						}
					}
					stream.push(out, f.apply(null, arr));
				});
			}
		};

		streams.reduce(function (i, s) {
			if (s.lastValue !== undefined) {
				arr[i] = s.lastValue;
				tryRunF();
			}
			stream.onValue(s, function (v) {
				arr[i] = v;
				tryRunF();
			});
			return i + 1;
		}, 0);

		return out;
	},
	all: function (streams, f) {
		return stream.combine(streams, function () {
			f.apply(null, arguments);
			return true;
		});
	},
	combineObject: function (streamsObject) {
		var keys = Object.keys(streamsObject);
		var obj = {};
		var out = stream.create();

		var running = false;
		var tryRunF = function () {
			if (!running) {
				running = true;
				setTimeout(function () {
					running = false;
					for (var i = 0; i < keys.length; i++) {
						var key = keys[i];
						if (obj[key] === undefined) {
							return;
						}
					}
					stream.push(out, $.extend({}, obj));
				});
			}
		};

		keys.map(function (key, i) {
			stream.onValue(streamsObject[key], function (v) {
				obj[key] = v;
				tryRunF();
			});
		});

		return out;
	},
	splitObject: function (obj) {
		var keys = Object.keys(obj);
		var streams = {};
		keys.map(function (key) {
			streams[key] = stream.once(obj[key]);
		});
		return streams;
	},
	fromPromise: function (p, initialValue) {
		var out = stream.never();
		if (initialValue) {
			stream.push(out, initialValue);
		}
		p.then(function (v) {
			stream.push(out, v);
		});
		return out;
	},
	cases: function (streams, indexS) {
		streams.push(indexS);
		return stream.combine(streams, function () {
			var args = Array.prototype.slice.call(arguments);
			var index = args.pop();
			return args[index];
		});
	},
};

var updateDomEls = [];
var updateDomProps = [];
var updateDomValues = [];
var runDomFuncs = function () {
	for (var i = 0; i < updateDomEls.length; i++) {
		updateDomEls[i].css(updateDomProps[i], updateDomValues[i]);
	}
	updateDomEls = [];
	updateDomProps = [];
	updateDomValues = [];
	updateWindowWidth();
};
var updateDomFunc = function ($el, prop, value) {
	if (updateDomEls.length === 0) {
		setTimeout(runDomFuncs);
	}
	updateDomEls.push($el);
	updateDomProps.push(prop);
	updateDomValues.push(value);
};

var el = function (name) {
	return function (build) {
		return function ($parent) {
			var $el = $(document.createElement(name));
			var context = {
				$el: $el,
				minWidth: stream.create(),
				minHeight: stream.create(),
				width: stream.create(),
				height: stream.create(),
				top: stream.create(),
				left: stream.create(),
				topAccum: stream.create(),
				leftAccum: stream.create(),
				scroll: stream.create(),
			};

			$el.css('pointer-events', 'initial')
				.css('position', 'absolute')
				.css('visibility', 'hidden');

			stream.onValue(context.top, function (t) {
				updateDomFunc($el, 'top', px(t));
			});
			stream.onValue(context.left, function (l) {
				updateDomFunc($el, 'left', px(l));
			});
			stream.onValue(context.width, function (w) {
				updateDomFunc($el, 'width', px(w));
			});
			stream.onValue(context.height, function (h) {
				// console.log($el);
				// console.log(h);
				updateDomFunc($el, 'height', px(h));
			});
			stream.all([
				context.width,
				context.height,
				context.top,
				context.left
			], function () {
				updateDomFunc($el, 'visibility', '');
			});

			var measureWidth = function (w) {
				var $sandbox = $('.sandbox');
				var $clone = $el.clone();
				$clone.css('width', px(w || ''))
					.css('height', '')
					.appendTo($sandbox);

				var width = $clone[0].scrollWidth;
				$clone.remove();

				stream.push(context.minWidth, width);
				return width;
			};

			var measureHeight = function () {
				stream.push(context.minHeight, function (w) {
					var $sandbox = $('.sandbox');
					var $clone = $el.clone();
					$clone.css('width', px(w))
						.css('height', '')
						.appendTo($sandbox);

					var height = parseInt($clone.css('height'));

					$clone.remove();

					return height;
				});
			};

			var unbuild = build(context, measureWidth, measureHeight) || id;
			context.destroy = function () {
				unbuild();
				$el.remove();
			};
			$el.appendTo($parent);

			return context;
		};
	};
};

var a = el('a');
var button = el('button');
var div = el('div');
var form = el('form');
var iframe = el('iframe');
var img = el('img');
var input = el('input');
var li = el('li');
var option = el('option');
var select = el('select');
var textarea = el('textarea');
var ul = el('ul');
