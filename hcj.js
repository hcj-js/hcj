var unit = function (unit) {
	return function (number) {
		return number + unit;
	};
};
var px = unit('px');

var url = function (str) {
	return 'url("' + str + '")';
};


// and :: (Instance -> IO ()) -> Component -> Component
// used typically to have some side effect on the component instance
var and = function (f) {
	return function (c) {
		return component(function ($el) {
			var i = c($el);
			f(i);
			return i;
		});
	};
};


var andUnbind = function (f) {
	return function (c) {
		return component(function ($el) {
			var i = c($el);
			var unbindF = f(i);
			var unbind = i.unbind;
			i.unbind = function () {
				unbindF();
				unbind();
			};
			return i;
		});
	};
};


// need the above?
var andUnbindD = function (f) {
	return function (c) {
		return component(function ($el) {
			var i = c($el);
			var unbindF = f(i);
			var unbind = i.unbind;
			i.unbind = function () {
				unbindF(unbind);
			};
			return i;
		});
	};
};


// append :: Component -> Component -> Component
// returns a component given by a parent with a child constructed onto it
var append = function (parent, child) {
	return component(function ($c) {
		var pI = parent($c);
		var cI = child(pI.$el);
		return {
			$el: pI.$el,
			unbind: function () {
				cI.unbind();
				pI.unbind();
			},
		};
	});
};


// todo: replace append with child
var child = function (child) {
	return function (parent) {
		return component(function ($c) {
			var pI = parent($c);
			var cI = child(pI.$el);
			return {
				$el: pI.$el,
				unbind: function () {
					cI.unbind();
					pI.unbind();
				},
			};
		});
	};
};


// all :: [a -> a] -> a -> a
var all = function (fs) {
	return function (c) {
		return fs.reduce(function (c, f) {
			return f(c);
		}, c);
	};
};


// creates a component
// notice there's some magic sauce reflection - it's for user convenience
// used only by the following two functions
var component = function (c) {
	return function (arg) {
		if (Array.isArray(arg)) {
			return component(all(arg)(c));
		}
		else if ($.isFunction(arg)) {
			return component(arg(c));
		}
		else {
			return c(arg);
		}
	};
};


// el :: String -> Component
// creates an html node
var el = function (name) {
	return component(function ($container) {
		var $el = $(document.createElement(name));
		$container.append($el);
		return {
			$el: $el,
			unbind: function () {
				$el.remove();
			},
		};
	});
};


// textNode :: String -> Component
// creates a text node
var textNode = function (text) {
	return component(function ($container) {
		var $text = $(document.createTextNode(text));
		$container.append($text);
		return {
			$el: $text,
			unbind: function () {
				$text.remove();
			},
		};
	});
};

var choose = function (f) {
	return component(function ($container) {
		return f($container)($container);
	});
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
	
	return component(function ($el) {
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
	});
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

var paddingAll = function (p) {
	return all([
		paddingRight(p),
		paddingLeft(p),
		paddingTop(p),
		paddingBottom(p),
	]);
};

var cols = function (count, color) {
	return all([
		$css('column-count', count),
		$css('-webkit-column-count', count),
		$css('-moz-column-count', count),
		$css('column-rule', '1px solid ' + color.background),
		$css('-webkit-column-rule', '1px solid ' + color.background),
		$css('-moz-column-rule', '1px solid ' + color.background),
	]);
};


var clear = $addClass('clear')(div);

var on = function (name) {
	return function ($s, f) {
		return andUnbind(function (i) {
			var token = '.a' + (Math.random() + '').replace('.', '');
			name = name + token;
			$s.on(name, function ($ev) {
				return f($ev, i);
			});
			return function () {
				i.$el.off(name);
			};
		});
	};
};
var click = on('click');


var onThis = function (name) {
	return function (f) {
		return and(function (i) {
			i.$el.on(name, function ($ev) {
				return f($ev, i);
			});
		});
	};
};
var clickThis = onThis('click');


var state = function (f) {
	return and(function (i) {
		var st;
		var get = function () {
			return st;
		};
		var set = function (st2) {
			st = st2;
		};
		return f(get, set, i);
	});
};
