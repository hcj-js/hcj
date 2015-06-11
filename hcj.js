var unit = function (unit) {
	return function (number) {
		return number + unit;
	};
};
var px = unit('px');


// el :: String -> Component
// creates an html node
var el = function (name) {
	return function ($container) {
		var $el = $(document.createElement(name));
		$container.append($el);
		return {
			$el: $el,
			unbind: function () {
				$el.remove();
			},
		};
	};
};


// textNode :: String -> Component
// creates a text node
var textNode = function (text) {
	return function ($container) {
		var $text = $(document.createTextNode(text));
		$container.append($text);
		return {
			$el: $text,
			unbind: function () {
				$text.remove();
			},
		};
	};
};

// and :: (Instance -> IO ()) -> Component -> Component
// used typically to have some side effect on the component instance
var and = function (f) {
	return function (c) {
		return function ($el) {
			var i = c($el);
			f(i);
			return i;
		};
	};
};


// append :: Component -> Component -> Component
// returns a component given by a parent with a child constructed onto it
var append = function (parent, child) {
	return function ($c) {
		var pI = parent($c);
		var cI = child(pI.$el);
		return {
			$el: pI.$el,
			unbind: function () {
				cI.unbind();
				pI.unbind();
			},
		};
	};
};


// all :: [Component -> Component] -> Component -> Component
var all = function (fs) {
	return function (c) {
		return fs.reduce(function (c, f) {
			return f(c);
		}, c);
	};
};


// div :: Component
var a = el('a');
var div = el('div');
var img = el('img');


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
var $addClass = $$('addClass');
var $css = $$('css');
var $attr = $$('attr');
var $html = $$('html');


// concat :: [Component] -> Component
// returns a component that concatenates multiple components together
// within a div
var concat = function () {
	var components = [];
	for (var i = 0; i < arguments.length; i++) {
		var arg = arguments[i];
		if (Array.isArray(arg)) {
			components = components.concat(arg);
		}
		else {
			components.push(arg);
		}
	}
	
	return function ($el) {
		var iDiv = div($el);

		var iCs = components.map(function (c) {
			return c(iDiv.$el);
		});
		
		return {
			$el: iDiv.$el,
			unbind: function () {
				iCs.map(function (iC) {
					iC.unbind();
				});
				iDiv.unbind();
			},
		};
	};
};

// returns a component that concatenates components as inline-block
// divs, and justifies them
var justify = function (components) {
	for (var ii = components.length - 1; ii >= 0; ii--) {
		components.splice(ii, 0, textNode(' '));
	}
	return $addClass('justify')(concat(components));
};

// clear floats
var clear = $addClass('clear')(div);

// link :: Component -> Component
// assert an element is a link
var link = $css('cursor', 'pointer');
