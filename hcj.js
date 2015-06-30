var Instance = object({
	$el: JQuery,
	destroy: func(),
});

var Component = func([JQuery], Instance);

var Unit = func(Number, String);
var unit = type(
	func(String),
	function (unit) {
		return type(Unit, function (number) {
			return number + unit;
		});
	});
var px = unit('px');

var url = function (str) {
	return 'url("' + str + '")';
};


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
		return f(this);
	};
	c.all = function () {
		return all.apply(window, arguments)(this);
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


// $$ :: String -> [*] -> Component -> Component
// applies a jquery function to the component instance after creation
var $$ = function (func) {
	return function () {
		var args = arguments;
		return and(function (i) {
			i.$el[func].apply(i.$el, args);
		});
	};
};

var $addClass = type(
	func(String),
	$$('addClass'));

var $css = type(
	func([String, String]),
	$$('css'));

var $attr = type(
	func([String, String]),
	$$('attr'));

var $prop = type(
	func([String, String]),
	$$('prop'));

var $html = type(
	func(String),
	$$('html'));


var insertBetween = function (component, components) {
	for (var ii = components.length - 1; ii > 0; ii--) {
		components.splice(ii, 0, component);
	}
	
	return components;
};


var resizeWindow = $(window).asEventStream('resize').map(function () {
	return {
		width: window.innerWidth,
		height: window.innerHeight,
	};
});
var scrollWindow = $(window).asEventStream('scroll');
