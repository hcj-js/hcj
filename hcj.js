var unit = function (unit) {
	return function (number) {
		return number + unit;
	};
};
var px = unit('px');

var url = function (str) {
	return 'url("' + str + '")';
};


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


var applyColorJquery = function ($el, color, noise) {
	if (noise) {
		$el.css('background-image', url(color.noiseSrc));
		$el.css('color', color.text);
	}
	else {
		$el.css('background-color', color.background);
		$el.css('color', color.text);
	}
};

var applyColor = function (color, noise) {
	if (noise) {
		return all([
			$css('background-image', url(color.noiseSrc)),
			$css('color', color.text),
		]);
	}
	else {
		return all([
			$css('background-color', color.background),
			$css('color', color.text),
		]);
	}
};

var link = $css('cursor', 'pointer');
var inline = $css('display', 'inline-block');

var margin = function (direction) {
	return function (amount) {
		return $css('margin-' + direction, amount);
	};
};
var marginRight = margin('right');
var marginLeft = margin('left');
var marginTop = margin('top');
var marginBottom = margin('bottom');

var padding = function (direction) {
	return function (amount) {
		return $css('padding-' + direction, amount);
	};
};
var paddingRight = padding('right');
var paddingLeft = padding('left');
var paddingTop = padding('top');
var paddingBottom = padding('bottom');


var clear = $addClass('clear')(div);
