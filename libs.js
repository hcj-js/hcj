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

var justify = function (components) {
	for (var ii = components.length - 1; ii >= 0; ii--) {
		components.splice(ii, 0, textNode(' '));
	}
	return concat(components).and($addClass('justify'));
};

var GridConfig = object({
	
});

var grid = type(
	func(GridConfig, Component),
	function (config) {
		return div;
	});
