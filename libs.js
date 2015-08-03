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


// $$ :: String -> [*] -> Component -> Component
// applies a jquery function to the component instance after creation
var $$ = function (func) {
	return function () {
		var args = arguments;
		return function (i) {
			i.$el[func].apply(i.$el, args);
		};
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


var windowWidth = function () {
	return $(window).asEventStream('resize').map(function () {
		return window.innerWidth;
	}).merge(Bacon.once(window.innerWidth));
};

var scrollWindow = $(window).asEventStream('scroll');


var concat = type(
	func([stream(Component), stream(Component)], Component),
	function (addCs, removeCs) {
		var cs = [];
		var is = [];
		
		var minWidth = 0;

		addCs.onValue(function (c) {
			cs.push(c);
		});
		
		var conc = div.all([
			function (i) {
				var addC = function (c) {
					debugger;
					is.push(c.create(i.$el, c.minWidth, Bacon.never()));
					c.minWidth.scan(0, function (a, v) {
						minWidth += (v - a);
						conc.minWidth.push(minWidth);
						return v;
					});
				};
				
				cs.map(addC);
				addCs.onValue(addC);
			},
		]);
		
		return conc;
	});


var GridConfig = object({
});


var grid = type(
	func(GridConfig, Component),
	function (config) {
		return div;
	});
