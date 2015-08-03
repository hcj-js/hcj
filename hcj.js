var JQuery = instance($, 'JQuery');

var Point2D = object({
	x: number,
	y: number,
});

var Context = object({
	$el: JQuery,               // contanier
	position: stream(Point2D), // top and left coordinates
	width: stream(number),     // set width of element
	height: stream(number),    // set height of element
});

var Instance = object({
	$el: JQuery,               // root element
	optimalWidth: number,      // parent component may use this to update the width of the instance
	minHeight: stream(number), // parent component may use this to update the width of the instance
	destroy: func(),           // completely remove instance
});

var Component = object({
	create: func([Context], Instance),
	and: function () {
		return func([or([
			func([Instance], func([], promise())),
			func([Instance], func()),
			func([Instance], Bottom),
		])], Component);
	},
	all: function () {
		return func([list(or([
			func([Instance], func([], promise())),
			func([Instance], func()),
			func([Instance], Bottom),
		]))], Component);
	},
});


var child = type(
	func(Component, func(Component, Component)),
	function (child) {
		return and(function (i) {
			return child(i.$el).destroy;
		});
	});


var all = function (fs) {
	return function (c) {
		return fs.reduce(function (c, f) {
			return f(c);
		}, c);
	};
};


// add some syntactic sugar for calling and and all
var component = type(
	func([func([Context], Instance)], Component),
	function (create) {
		var comp = {
			create: create,
			and: function (f) {
				return component(function ($el) {
					var i = create($el);
					var destroyF = f(i);
					var destroy = i.destroy;
					if (destroyF) {
						i.destroy = function () {
							var p = destroyF();
							if (p) {
								p.then(function () {
									destroy();
								});
							}
							else {
								destroy();
							}
						};
					}
					return i;
				});
			},
			all: function (fs) {
				return fs.reduce(function (c, f) {
					return c.and(f);
				}, comp);
			},
		};
		return comp;
	});


var el = type(
	func(string, Component),
	function (name) {
		return component(function (context) {
			var $el = $(document.createElement(name));
			context.$el.append($el);

			context.width.onValue(function (w) {
				$el.css('width', px(w));
			});
			context.height.onValue(function (h) {
				$el.css('height', px(h));
			});
			context.position.onValue(function (p) {
				$el.css('top', px(p.y));
				$el.css('left', px(p.x));
			});
			
			return {
				$el: $el,
				optimalWidth: 0,
				minHeight: new Bacon.Bus(),
				destroy: function () {
					$el.remove();
				},
			};
		});
	});


// textNode :: String -> Component
// creates a text node
var textNode = function (text) {
	return function ($container, widths) {
		var $text = $(document.createTextNode(text));
		$container.append($text);
		
		widths.onValue(function (w) {
			$el.css('width', px(w));
		});
		
		return {
			$el: $text,
			dims: Bacon.never(),
			destroy: function () {
				$text.remove();
			},
		};
	};
};

// div :: Component
var a = el('a');
var div = el('div');
var img = el('img');
var input = el('input');
var li = el('li');
var textarea = el('textarea');
var ul = el('ul');

var rootI = function () {
	return div()($('body'));
};
