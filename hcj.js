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
	minWidth: number,          // parent component may use this to update the width of the instance
	minHeight: stream(number), // parent component may be interested
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


// add some syntactic sugar for calling and and all
var component = type(
	func([func([Context], Instance)], Component),
	function (create) {
		var comp = {
			create: function (context) {
				var i = create(context);
				setTimeout(function () {
					i.minHeight.push(findMinHeight(i.$el));
				});
				return i;
			},
			and: function (f) {
				return component(function (context) {
					var i = create(context);
					var destroyF = f(i, context);
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

var findMinHeight = function ($el) {
	var $sandbox = $('.sandbox');
	var $clone = $el.clone();
	$clone.css('height', '')
		.appendTo($sandbox);

	var height = parseInt($clone.css('height'));
	
	$clone.remove();

	return height;
};

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

			var minHeight = new Bacon.Bus();
			
			return {
				$el: $el,
				optimalWidth: 0,
				minHeight: minHeight,
				destroy: function () {
					minHeight.push(0);
					$el.remove();
				},
			};
		});
	});


// div :: Component
var a = el('a');
var div = el('div');
var img = el('img');
var input = el('input');
var li = el('li');
var textarea = el('textarea');
var ul = el('ul');

var rootContext = function () {
	return type(Context, {
		$el: $('body'),
		position: Bacon.once({
			x: 0,
			y: 0,
		}),
		width: windowWidth(),
		height: Bacon.never(),
	});
};
