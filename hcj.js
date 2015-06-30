var Instance = object({
	$el: JQuery,
	destroy: func(),
});

var Component = func([JQuery], Instance);

// Runs a function on each new instance of a component.  If the
// function returns a function, the returned function is held in
// memory, and run when the instance is destroyed.  If the destructor
// function returns an async promise, the promise is awaited before
// the prototype component's destroy function is executed.
var and = type(
	func(func(Instance, or([
		Bottom,
	])), func(Component, Component)), function (f) {
		return function (c) {
			return function ($el) {
				var i = c($el);
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
			};
		};
	});


var child = type(
	func(Component, func(Component, Component)),
	function (child) {
		return and(function (i) {
			return child(i.$el).destroy;
		});
	});


var all = type(
	func(array(func(Component, Component)), func(Component, Component)),
	function (fs) {
		return function (c) {
			return fs.reduce(function (c, f) {
				return f(c);
			}, c);
		};
	});


// add some syntactic sugar for calling and and all
var component = function (c) {
	c.and = function (f) {
		return component(f(this));
	};
	c.all = function () {
		return component(all.apply(window, arguments)(this));
	};
	return c;
};


// el :: String -> Component
// creates an html node
var el = function (name) {
	return component(function ($container) {
		var $el = $(document.createElement(name));
		$container.append($el);
		return {
			$el: $el,
			destroy: function () {
				$el.remove();
			},
		};
	});
};


// textNode :: String -> Component
// creates a text node
var textNode = function (text) {
	return function ($container) {
		var $text = $(document.createTextNode(text));
		$container.append($text);
		return {
			$el: $text,
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
