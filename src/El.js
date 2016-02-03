define([], function () {
	var el = function ($el) {
		return function (initialize) {
			$el.css('position', 'absolute');
			return function (dimsS, posS) {
				dimsS.map(function (dims) {
					
				});
			};
		};
	};
	var create = function (name) {
		return el($(document.createElement(name)));
	};
	return {
		attach: function ($el) {
			return el($el);
		},
		div: create('div'),
	};
});
