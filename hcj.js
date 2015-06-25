var unit = function (unit) {
	return function (number) {
		return number + unit;
	};
};
var px = unit('px');

var url = function (str) {
	return 'url("' + str + '")';
};


// Runs a function on each new instance of a component.  If the
// function returns a function, the returned function is held in
// memory, and run when the instance is destroyed.  If the destructor
// function returns an async promise, the promise is awaited before
// the prototype component's destroy function is executed.
var and = function (f) {
	return function (c) {
		return component(function ($el) {
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
		});
	};
};


var child = function (child) {
	return function (parent) {
		return component(function ($c) {
			var pI = parent($c);
			var cI = child(pI.$el);
			return {
				$el: pI.$el,
				destroy: function () {
					cI.destroy();
					pI.destroy();
				},
			};
		});
	};
};


var all = function (fs) {
	return function (c) {
		return fs.reduce(function (c, f) {
			return f(c);
		}, c);
	};
};


// creates a component
// notice there's some magic sauce reflection - it's for user convenience
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
			destroy: function () {
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
			destroy: function () {
				$text.remove();
			},
		};
	});
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
var $addClass = $$('addClass');
var $css = $$('css');
var $attr = $$('attr');
var $html = $$('html');
var $prop = $$('prop');


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
			destroy: function () {
				iCs.map(function (iC) {
					iC.destroy();
				});
				iDiv.destroy();
			},
		};
	});
};

var insertBetween = function (component, components) {
	for (var ii = components.length - 1; ii > 0; ii--) {
		components.splice(ii, 0, component);
	}
	
	return components;
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

var left = $css('float', 'left');
var right = $css('float', 'right');
var clear = $addClass('clear')(div);

var hSpace = function (width) {
	return div([
		$css('width', width),
		inline,
	]);
};
var vSpace = function (height) {
	return div([
		$css('height', height),
	]);
};


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



var onOff = function ($s, name, f) {
	var token = '.a' + (Math.random() + '').replace('.', '');
	name = name + token;
	$s.on(name, function ($ev) {
		return f($ev, i);
	});
	return function () {
		$s.off(name);
	};
};


var on = function (name) {
	return function ($s, f) {
		return and(function (i) {
			return onOff(i.$el, name, f);
		});
	};
};
var click = on('click');
var mousemove = on('mousemove');
var mouseover = on('mouseover');


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
var mousemoveThis = onThis('mousemove');
var mouseoverThis = onThis('mouseover');
var mouseoutThis = onThis('mouseout');


var hoverCSS = function (obj) {
	var oldStyles = null;

	var setStyles = function ($ev, i) {
		if (!oldStyles) {
			oldStyles = {};
			for (var key in obj) {
				oldStyles[key] = i.$el.css(key);
			}
		}
		for (var key in obj) {
			i.$el.css(key, obj[key]);
		}
	};

	var unsetStyles = function ($ev, i) {
		for (var key in obj) {
			i.$el.css(key, oldStyles[key]);
		}
	};

	return all([
		mousemoveThis(setStyles),
		mouseoutThis(unsetStyles),
	]);
};


var resizeWindow = $(window).asEventStream('resize').map(function () {
	return {
		width: window.innerWidth,
		height: window.innerHeight,
	};
});

var scrollWindow = $(window).asEventStream('scroll');
