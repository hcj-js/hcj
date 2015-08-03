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
		var states = [];
		
		var conc = div.all([
			function (i, context) {
				
				addCs.onValue(function (c) {
					var positionStream = states.reduce(function (sum, state) {
						return sum.combine(state.instance.minHeight, function (a, b) {
							return a + b;
						});
					}, Bacon.once(0)).map(function (y) {
						return {
							x: 0,
							y: y,
						};
					});
					
					var cContext = {
						$el: i.$el,
						position: positionStream,
						width: context.width,
						height: Bacon.never(),
					};

					var index = states.length;
					var state = {
						component: c,
						instance: c.create(cContext),
					};
					states.push(state);

					var updateHeight = function () {
						i.minHeight.push(states.reduce(function (a, s) {
							return a + s.minHeight;
						}, 0));
					};

					state.instance.minHeight.onValue(function (mh) {
						state.minHeight = mh;
						updateHeight();
					});
				});
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
