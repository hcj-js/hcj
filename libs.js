var passThroughToFirst = function (instance, context, i) {
	i.minHeight.pushAll(instance.minHeight);
	i.minWidth.pushAll(instance.minWidth);
	return [{
		width: context.width,
		height: context.height,
		top: Stream.once(0),
		left: Stream.once(0),
	}];
};

var unit = function (unit) {
	return function (number) {
		return number + unit;
	};
};
var px = unit('px');

var url = function (str) {
	return 'url("' + str + '")';
};


var color = function (c) {
	return $.extend({
		r: 0,
		g: 0,
		b: 0,
		a: 1,
	}, c);
};
var multiplyColor = function (amount) {
	return function (c) {
		return {
			r: Math.min(255, c.r * amount),
			g: Math.min(255, c.g * amount),
			b: Math.min(255, c.b * amount),
			a: c.a,
		};
	};
};
var desaturate = function (amount) {
	return function (c) {
		var average = (c.r + c.g + c.b) / 3;
		var coAmount = 1 - amount;
		return {
			r: coAmount * c.r + amount * average,
			g: coAmount * c.g + amount * average,
			b: coAmount * c.b + amount * average,
			a: c.a,
		};
	};
};
var colorString = function (c) {
	return 'rgba(' + Math.floor(c.r) + ',' + Math.floor(c.g) + ',' + Math.floor(c.b) + ',' + c.a + ')';
};
var rgbColorString = function (c) {
	return 'rgb(' + Math.floor(c.r) + ',' + Math.floor(c.g) + ',' + Math.floor(c.b) + ')';
};
var transparent = color({
	a: 0,
});
var black = color({
	r: 0,
	g: 0,
	b: 0,
});
var white = color({
	r: 255,
	g: 255,
	b: 255,
});




// $$ :: String -> [*] -> Component -> Component
// applies a jquery function to the component instance after creation
var $$ = function (func) {
	return function () {
		var args = Array.prototype.slice.call(arguments);
		return function (i) {
			i.$el[func].apply(i.$el, args);
			setTimeout(function () {
				i.updateDimensions(true);
			});
		};
	};
};

var $addClass = $$('addClass');
var $css = $$('css');
var $attr = $$('attr');
var $prop = $$('prop');

var chooseHeightFromWidth = function (instance, context) {
	var choosingHeight = false;
	context.width.onValue(function (w) {
		if (!choosingHeight) {
			choosingHeight = true;
			setTimeout(function () {
				var optimalHeight = findOptimalHeight(instance.$el, w);
				instance.minHeight.push(optimalHeight);
				choosingHeight = false;
			});
		}
	});
};
var $html = function (html, setWidth) {
	return function (instance, context) {
		instance.$el.html(html);
		chooseHeightFromWidth(instance, context);
		if (setWidth) {
			instance.updateDimensions();
		}
	};
};


var windowWidth = Stream.never();
var windowHeight = Stream.never();
var updateWindowWidth = function () {
	windowWidth.push(document.body.clientWidth);
};
var updateWindowHeight = function () {
	windowHeight.push(window.innerHeight);
};
$(updateWindowWidth);
$(updateWindowHeight);
$(window).on('resize', function () {
	updateWindowWidth();
	updateWindowHeight();
});

var windowResize = Stream.once(null);
$(window).on('resize', function (e) {
	windowResize.push(e);
});

var windowScroll = Stream.never();
$(window).on('scroll', function () {
	windowScroll.push(window.scrollY);
});
windowScroll.push(window.scrollY);

var windowHash = Stream.never();
$(window).on('hashchange', function () {
	windowHash.push(location.hash);
});
windowHash.push(location.hash);


var withMinWidth = function (mw, end) {
	return function (i) {
		i.minWidth.push(mw);
		if (end) {
			i.minWidth.end();
		}
	};
};
var withMinHeight = function (mh, end) {
	return function (i) {
		i.minHeight.push(mh);
		if (end) {
			i.minHeight.end();
		}
	};
};
var withBackgroundColor = function (bc) {
	return function (i, context) {
		context.backgroundColor.push(colorString(bc));
	};
};
var withFontColor = function (fc) {
	return function (i, context) {
		context.fontColor.push(colorString(fc));
	};
};

var link = $css('cursor', 'pointer');

var componentName = function (name) {
	return function (i) {
		i.$el.addClass(name);
	};
};

// var on = function (event) {
// 	return function ($el, handler) {
// 		return function (i) {
// 		};
// 	};
// };

// var click = onEvent('click');

var onThis = function (event) {
	return function (handler) {
		return function (i) {
			var disabled = false;
			i.$el.on(event, function (ev) {
				if (!disabled) {
					return handler(ev, function () {
						disabled = true;
						return function () {
							disabled = false;
						};
					});
				}
			});
		};
	};
};
var changeThis = onThis('change');
var clickThis = onThis('click');
var inputPropertychangeThis = onThis('input propertychange');
var keydownThis = onThis('keydown');
var keyupThis = onThis('keyup');
var mousedownThis = onThis('mousedown');
var mouseoverThis = onThis('mouseover');
var mouseoutThis = onThis('mouseout');
var mouseupThis = onThis('mouseup');
var submitThis = onThis('click');


var image = function (config) {
	var srcStream = (config.src && config.src.map) ? config.src : Stream.once(config.src);
	return img.all([
		function (i, context) {
			srcStream.map(function (src) {
				i.$el.prop('src', src);
			});
			
			i.$el.on('load', function () {
				var nativeWidth = findMinWidth(i.$el);
				var nativeHeight = findMinHeight(i.$el);
				var aspectRatio = nativeWidth / nativeHeight;

				var minWidth, minHeight;
				if (config.useNativeSize !== undefined) {
					i.minWidth.push(nativeWidth);
					i.minHeight.push(nativeHeight);
				}
				
				if (config.minWidth !== undefined) {
					minWidth = config.minWidth;
					minHeight = minWidth / aspectRatio;
					i.minWidth.push(minWidth);
					i.minHeight.push(minHeight);
				}
				else if (config.minHeight !== undefined) {
					minHeight = config.minHeight;
					minWidth = minHeight * aspectRatio;
					i.minWidth.push(minWidth);
					i.minHeight.push(minHeight);
				}

				if (config.chooseWidth !== undefined) {
					context.height.map(function (height) {
						return Math.max(config.chooseWidth, height * aspectRatio);
					}).pushAll(i.minWidth);
				}
				
				if (config.chooseHeight !== undefined) {
					context.width.map(function (width) {
						return Math.max(config.chooseHeight, width / aspectRatio);
					}).pushAll(i.minHeight);
				}
			});
		},
	]);
};

var linkTo = function (href, c) {
	return a.all([
		$prop('href', href),
		child(c),
		wireChildren(passThroughToFirst),
	]);
};

var nothing = div.all([
	componentName('nothing'),
	withMinHeight(0),
	withMinWidth(0),
]);

var text = function (text) {
	if (!(text.map && text.push)) {
		text = Stream.once(text);
	}
	
	return div.all([
		componentName('text'),
		function (instance, context) {
			chooseHeightFromWidth(instance, context);
			text.onValue(function (t) {
				instance.$el.html(t);
				instance.minWidth.push(findMinWidth(instance.$el));
			});
		},
	]);
};
var faIcon = function (str) {
	return text('<i class="fa fa-' + str + '"></i>');
};
var paragraph = function (text, minWidth) {
	if (!(text.map && text.push)) {
		text = Stream.once(text);
	}

	minWidth = minWidth || 0;
	
	return div.all([
		componentName('paragraph'),
		function (instance, context) {
			chooseHeightFromWidth(instance, context);
			text.onValue(function (t) {
				instance.$el.html(t);
				var w = context.width.lastValue();
				if (w) {
					var optimalHeight = findOptimalHeight(instance.$el, w);
					instance.minHeight.push(optimalHeight);
				}
			});
		},
		withMinWidth(minWidth, true),
	]);
};

var ignoreSurplusWidth = function (_, cols) {
	return cols;
};
var ignoreSurplusHeight = function (_, rows) {
	return rows;
};
var evenSplitSurplusWidth = function (gridWidth, positions) {
	var lastPosition = positions[positions.length - 1];
	var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
	var widthPerCol = surplusWidth / positions.length;
	positions.map(function (position, i) {
		position.width += widthPerCol;
		position.left += i * widthPerCol;
	});
	return positions;
};
var justifySurplusWidth = function (gridWidth, positions) {
	var lastPosition = positions[positions.length - 1];
	var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
	positions.map(function (position, i) {
		for (var index = 0; index < i; index++) {
			position.left += surplusWidth / (positions.length - 1);
		}		
	});
	return positions;
};
var justifyAndCenterSurplusWidth = function (gridWidth, positions) {
	var lastPosition = positions[positions.length - 1];
	var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
	positions.map(function (position, i) {
		position.left += i * surplusWidth / (positions.length) +
			surplusWidth / (2 * positions.length);
	});
	return positions;
};

var superSurplusWidth = function (gridWidth, positions) {
	var lastPosition = positions[positions.length - 1];
	var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
	if (positions.length === 1) {
		// if we're the only thing on the row, stretch up to roughly
		// double our min width
		if (surplusWidth < positions[0].width) {
			return evenSplitSurplusWidth(gridWidth, positions);
		}
		else {
			return positions;
		}
	}
	if (positions.length === 2) {
		// if there are two things in the row, make two columns each
		// with centered content
		return justifyAndCenterSurplusWidth(gridWidth, positions);
	}
	// if there are 3+ things in the row, then justify
	return justifySurplusWidth(gridWidth, positions);
};

var giveToNth = function (n) {
	return function (gridWidth, positions) {
		var lastPosition = positions[positions.length - 1];
		var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
		positions.map(function (position, i) {
			if (i === n || (i === positions.length - 1 && n >= positions.length)) {
				position.width += surplusWidth;
			}
			else if (i > n) {
				position.left += surplusWidth;
			}
		});
		return positions;
	};
};
var giveToFirst = giveToNth(0);
var giveToSecond = giveToNth(1);
var giveToThird = giveToNth(2);
var evenSplitSurplusHeight = function (gridHeight, rows, config) {
};


var sideBySide = function (config, cs) {
	config.gutterSize = config.gutterSize || 0;
	config.handleSurplusWidth = config.handleSurplusWidth || ignoreSurplusWidth;
	return div.all([
		componentName('sideBySide'),
		children(cs),
		wireChildren(function (instance, context, is) {
			var allMinWidths = Stream.combine(is.map(function (i) {
				return i.minWidth;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args;
			});
			
			allMinWidths.onValue(function (mws) {
				instance.minWidth.push(mws.reduce(function (a, mw) {
					return a + mw;
				}, config.gutterSize * (is.length - 1)));
			});
			
			var contexts = is.map(function () {
				return {
					top: Stream.once(0),
					left: Stream.never(),
					width: Stream.never(),
					height: context.height,
				};
			});

			Stream.all([context.width, allMinWidths], function (width, mws) {
				var left = 0;
				var positions = mws.map(function (mw, index) {
					var position = {
						left: left + config.gutterSize * index,
						width: mw,
					};
					left += mw;
					return position;
				});
				positions = config.handleSurplusWidth(width, positions);

				positions.map(function (position, index) {
					var ctx = contexts[index];
					ctx.left.push(position.left);
					ctx.width.push(position.width);
				});
			});

			Stream.combine(is.map(function (i) {
				return i.minHeight;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args.reduce(function (a, b) {
					return Math.max(a, b);
				}, 0);
			}).pushAll(instance.minHeight);
			
			return [contexts];
		}),
	]);
};

var intersperse = function (arr, v) {
	var result = [];
	arr.map(function (el) {
		result.push(el);
		result.push(v);
	});
	result.pop();
	return result;
};

var stackTwo = function (options, cs) {
	options.gutterSize = options.gutterSize || 0;
	options.align = options.align || 'left';
	return div.all([
		componentName('stack'),
		children(cs),
		wireChildren(function (instance, context, is) {
			var i1 = is[0];
			var i2 = is[1];
			
			var gutterSize = options.gutterSize;
			var contexts = [];

			instance.minHeight.push(0);
			instance.minWidth.push(0);

			Stream.combine([
				i1.minHeight,
				i2.minHeight,
			], function (mh1, mh2) {
				return mh1 + mh2 + gutterSize;
			}).pushAll(instance.minHeight);

			Stream.combine([
				i1.minWidth,
				i2.minWidth,
			], function (mw1, mw2) {
				return Math.max(mw1, mw2);
			}).pushAll(instance.minWidth);
			
			return [[{
				top: Stream.once(0),
				left: Stream.once(0),
				width: context.width,
				height: i1.minHeight,
			}, {
				top: i1.minHeight.map(function (mh) {
					return mh + gutterSize;
				}),
				left: Stream.once(0),
				width: context.width,
				height: i2.minHeight,
			}]];
		}),
	]);
};

var stack = function (options, cs) {
	options.gutterSize = options.gutterSize || 0;
	options.collapseGutters = options.collapseGutters || false;
	options.align = options.align || 'left';
	return div.all([
		componentName('stack'),
		children(cs),
		wireChildren(function (instance, context, is) {
			var gutterSize = (options && options.gutterSize) || 0;
			var totalMinHeightStream = function (is) {
				if (is.length === 0) {
					return Stream.once(0);
				}
				return Stream.combine(is.map(function (i, index) {
					var iMinHeight;
					
					if (options && options.mhs && options.mhs[index]) {
						var optionMinHeight = options.mhs[index](context);
						return Stream.combine([i.minHeight, optionMinHeight], function (a, b) {
							return Math.max(a, b);
						});
					}
					else {
						return i.minHeight;
					}
					return i.minHeight;
				}), function () {
					var args = Array.prototype.slice.call(arguments);
					var mh = args.reduce(function (a, b) {
						return a + b + ((options.collapseGutters && b === 0) ? 0 : gutterSize);
					}, -gutterSize);
					return mh;
				});
			};
			
			var contexts = [];
			is.reduce(function (is, i, index) {
				var top = totalMinHeightStream(is).map(function (t) {
					return t === 0 ? t : t + ((options.collapseGutters && t === 0) ? 0 : gutterSize);
				});
				var iMinHeight;
				
				if (options && options.mhs && options.mhs[is.length]) {
					var optionMinHeight = options.mhs[is.length](context);
					iMinHeight = Stream.combine([i.minHeight, optionMinHeight], function (a, b) {
						return Math.max(a, b);
					});
				}
				else {
					iMinHeight = i.minHeight;
				}

				contexts.push({
					top: top,
					left: Stream.once(0),
					width: context.width,
					height: iMinHeight,
				});

				is.push(i);
				return is;
			}, []);

			totalMinHeightStream(is).pushAll(instance.minHeight);
			Stream.combine(is.map(function (i) {
				return i.minWidth;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args.reduce(function (a, b) {
					return Math.max(a, b);
				}, 0);
			}).pushAll(instance.minWidth);
			
			return [contexts];
		}),
	]);
};

var padding = function (amount, c) {
	var top = amount.all || 0,
		bottom = amount.all || 0,
		left = amount.all || 0,
		right = amount.all || 0;
	
	// amount may be a single number
	if ($.isNumeric(amount)) {
		top = bottom = left = right = amount;
	}
	// or an object with properties containing 'top', 'bottom', 'left', and 'right'
	else {
		for (var key in amount) {
			var lcKey = key.toLowerCase();
			if (lcKey.indexOf('top') !== -1) {
				top = amount[key];
			}
			if (lcKey.indexOf('bottom') !== -1) {
				bottom = amount[key];
			}
			if (lcKey.indexOf('left') !== -1) {
				left = amount[key];
			}
			if (lcKey.indexOf('right') !== -1) {
				right = amount[key];
			}
		}
	}
	return div.all([
		componentName('padding'),
		child(c),
		wireChildren(function (instance, context, i) {
			i.minWidth.map(function (mw) {
				return mw + left + right;
			}, 'padding min width').pushAll(instance.minWidth);
			
			i.minHeight.map(function (mh) {
				return mh + top + bottom;
			}, 'padding min height').pushAll(instance.minHeight);
			
			return [{
				top: Stream.once(top, 'padding top'),
				left: Stream.once(left, 'padding left'),
				width: context.width.map(function (w) {
					return w - left - right;
				}, 'padding width'),
				height: context.height.map(function (h) {
					return h - top - bottom;
				}, 'padding height'),
			}];
		}),
	]);
};

var alignLRM = function (lrm) {
	return div.all([
		componentName('alignLRM'),
		child(lrm.middle || nothing),
		child(lrm.left || nothing),
		child(lrm.right || nothing),
		wireChildren(function (instance, context, mI, lI, rI) {
			var headerHeight = Stream.combine([mI, lI, rI].map(function (i) {
				return i.minHeight;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				var height = args.reduce(function (h, mh) {
					return Math.max(h, mh);
				}, 0);
				return height;
			});
			headerHeight.pushAll(instance.minHeight);
			
			Stream.combine([mI, lI, rI].map(function (i) {
				return i.minWidth;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				var height = args.reduce(function (w, mw) {
					return w + mw;
				}, 0);
				return height;
			}).pushAll(instance.minWidth);

			var minAvailableRequested = function (available, requested) {
				return Stream.combine([available, requested], function (a, r) {
					return Math.min(a, r);
				});
			};
			var mWidth = minAvailableRequested(context.width, mI.minWidth);
			var lWidth = minAvailableRequested(context.width, lI.minWidth);
			var rWidth = minAvailableRequested(context.width, rI.minWidth);

			return [{
				top: Stream.once(0),
				left: Stream.combine([context.width, mWidth], function (width, mw) {
					return (width - mw) / 2;
				}),
				width: mWidth,
				height: context.height,
			}, {
				top: Stream.once(0),
				left: Stream.once(0),
				width: lWidth,
				height: context.height,
			}, {
				top: Stream.once(0),
				left: Stream.combine([context.width, rWidth], function (width, rMW) {
					return width - rMW;
				}),
				width: rWidth,
				height: context.height,
			}];
		}),
	]);
};

var alignTBM = function (tbm) {
	tbm.middle = tbm.middle || nothing;
	tbm.bottom = tbm.bottom || nothing;
	tbm.top = tbm.top || nothing;
	
	return div.all([
		componentName('alignTBM'),
		child(tbm.middle),
		child(tbm.bottom),
		child(tbm.top),
		wireChildren(function (instance, context, mI, bI, tI) {
			var minWidth = Stream.combine([mI, bI, tI].map(function (i) {
				return i.minWidth;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				var width = args.reduce(function (w, mw) {
					return Math.max(w, mw);
				}, 0);
					return width;
			}, 'alignTBM min width');
			minWidth.pushAll(instance.minWidth);
			
			Stream.combine([mI, bI, tI].map(function (i) {
				return i.minHeight;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				var height = args.reduce(function (h, mh) {
					return h + mh;
				}, 0);
					return height;
			}, 'alignTBM min height').pushAll(instance.minHeight);

			return [{
				top: Stream.combine([context.height, mI.minHeight], function (height, mh) {
					return (height - mh) / 2;
				}, 'alignTBM top.top'),
				left: Stream.once(0),
				width: context.width,
				height: mI.minHeight,
			}, {
				top: Stream.combine([context.height, bI.minHeight], function (height, mh) {
					return height - mh;
				}, 'alignTBM bottom.top'),
				left: Stream.once(0),
				width: context.width,
				height: bI.minHeight,
			}, {
				top: Stream.once(0),
				left: Stream.once(0),
				width: context.width,
				height: tI.minHeight,
			}];
		}),
	]);
};
var invertOnHover = function (c) {
	var invert = Stream.once(false, 'invert');
	
	var choose = function (stream1, stream2) {
		return Stream.combine([invert, stream1, stream2], function (i, v1, v2) {
			return i ? v2 : v1;
		}, 'choose stream');
	};
	
	
	return div.all([
		componentName('invert-on-hover'),
		child(c.and($css('transition', 'background-color 0.2s linear, color 0.1s linear'))),
		wireChildren(function (instance, context, i) {
			i.minHeight.pushAll(instance.minHeight);
			i.minWidth.pushAll(instance.minWidth);
			return [{
				backgroundColor: choose(context.backgroundColor, context.fontColor),
				fontColor: choose(context.fontColor, context.backgroundColor),
				top: Stream.once(0),
				left: Stream.once(0),
				width: context.width,
				height: context.height,
			}];
		}),
		mouseoverThis(function () {
			invert.push(true);
		}),
		mouseoutThis(function () {
			invert.push(false);
		}),
	]);
};

var border = function (color, amount, c) {
	var left = amount.left || amount.all || 0;
	var right = amount.right || amount.all || 0;
	var top = amount.top || amount.all || 0;
	var bottom = amount.bottom || amount.all || 0;
	var radius = amount.radius || 0;

	var colorstring = colorString(color);
	
	return div.all([
		componentName('border'),
		child(div.all([
			componentName('border-child'),
			$css('border-left', px(left) + ' solid ' + colorstring),
			$css('border-right', px(right) + ' solid ' + colorstring),
			$css('border-top', px(top) + ' solid ' + colorstring),
			$css('border-bottom', px(bottom) + ' solid ' + colorstring),
			$css('border-radius', px(radius)),
			child(c),
			wireChildren(passThroughToFirst),
		])),
		wireChildren(function (instance, context, i) {
			i.minWidth.map(function (mw) {
				return mw + left + right;
			}).pushAll(instance.minWidth);
			
			i.minHeight.map(function (mh) {
				return mh + top + bottom;
			}).pushAll(instance.minHeight);
			
			return [{
				top: Stream.once(0),
				left: Stream.once(0),
				width: context.width.map(function (w) {
					return w - left - right;
				}),
				height: context.height.map(function (h) {
					return h - top - bottom;
				}),
			}];
		}),
	]);
};

var componentStream = function (cStream) {
	var i;
	return div.all([
		componentName('use-component-stream'),
		function (instance, context) {
			var ctx = instance.newCtx();
			ctx.top.push(0);
			ctx.left.push(0);
			context.width.pushAll(ctx.width);
			context.height.pushAll(ctx.height);
			
			var localCStream = Stream.create();
			cStream.pushAll(localCStream);
			localCStream.map(function (c) {
				var instanceC = function (c) {
					if (i) {
						i.destroy();
					}
					i = c.create(ctx);
					i.$el.css('transition', 'inherit');
					i.minWidth.pushAll(instance.minWidth);
					i.minHeight.pushAll(instance.minHeight);
				};
				if (c.then) {
					c.then(function (c) {
						instanceC(c);
					}, function (error) {
						console.error('child components failed to load');
						console.log(error);
					});
				}
				else {
					instanceC(c);
				}
			});
			return function () {
				localCStream.end();
				if (i) {
					i.destroy();
				}
			};
		},
	]);
};

var promiseComponent = function (cP) {
	var stream = Stream.once(nothing);
	cP.then(function (c) {
		stream.push(c);
	});
	return componentStream(stream);
};

var toggleComponent = function (cs, indexStream) {
	return componentStream(indexStream.map(function (i) {
		return cs[i];
	}));
};

var modalDialog = function (stream, transition) {
	var open = Stream.once(false);
	stream.pushAll(open);
	
	transition = transition || 0;
	
	return function (c) {
		return div.all([
			$css('z-index', 100),
			componentName('toggle-height'),
			child(c),
			wireChildren(function (instance, context, i) {
				instance.minWidth.push(0);
				instance.minHeight.push(0);
				
				var $el = i.$el;
				$el.css('position', 'fixed');
				$el.css('transition', 'opacity ' + transition + 's');
				$el.css('display', 'none');
				
				open.onValue(function (on) {
					if (on) {
						$el.css('display', '');
						setTimeout(function () {
							$el.css('opacity', 1);
						}, 100);
					}
					else {
						$el.css('opacity', 0);
						setTimeout(function () {
							$el.css('display', 'none');
						}, transition * 1000);
					}
				});
				
				return [{
					width: i.minWidth,
					height: i.minHeight,
					left: Stream.combine([
						windowWidth,
						i.minWidth,
					], function (windowWidth, minWidth) {
						return (windowWidth - minWidth) / 2;
					}),
					top: Stream.combine([
						windowHeight,
						i.minHeight,
					], function (windowHeight, minHeight) {
						return Math.max(0, (windowHeight - minHeight) / 2);
					}),
				}];
			}),
		]);
	};
};

var toggleHeight = function (stream) {
	var open = Stream.once(false);
	stream.pushAll(open);
	return function (c) {
		return div.all([
			$css('overflow', 'hidden'),
			componentName('toggle-height'),
			child(c),
			wireChildren(function (instance, context, i) {
				i.minWidth.pushAll(instance.minWidth);
				Stream.combine([i.minHeight, open], function (mh, onOff) {
					return onOff ? mh : 0;
				}).pushAll(instance.minHeight);
				return [{
					top: Stream.once(0),
					left: Stream.once(0),
					width: context.width,
					height: context.height,
				}];
			}),
		]);
	};
};

var dropdownPanel = function (source, panel, onOff, config) {
	config = config || {};
	config.transition = config.transition || "0.5s";
	return div.all([
		componentName('dropdown-panel'),
		child(panel),
		child(source),
		wireChildren(function (instance, context, iPanel, iSource) {
			iSource.minWidth.pushAll(instance.minWidth);
			iSource.minHeight.pushAll(instance.minHeight);
			iPanel.$el.css('transition', 'top ' + config.transition);
			return [{
				width: context.width,
				height: iPanel.minHeight,
				top: Stream.combine([onOff, iPanel.minHeight, context.height], function (on, mh, h) {
					return on ? h : h - mh;
				}),
				left: Stream.once(0),
			}, {
				width: context.width,
				height: context.height,
				top: Stream.once(0),
				left: Stream.once(0),
			}];
		}),
	]);
};

var fixedHeaderBody = function (config, header, body) {
	config.transition = config.transition || "0.5s";
	return div.all([
		componentName('fixedHeaderBody'),
		child(body),
		child(header),
		wireChildren(function (instance, ctx, bodyI, headerI) {
			headerI.$el.css('position', 'fixed');

			setTimeout(function () {
				headerI.$el.css('transition', 'height ' + config.transition);
				bodyI.$el.css('transition', 'top ' + config.transition);
			});

			Stream.combine([bodyI, headerI].map(function (i) {
				return i.minHeight;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args.reduce(function (a, i) {
					return a + i;
				}, 0);
			}).pushAll(instance.minHeight);
			
			Stream.combine([bodyI, headerI].map(function (i) {
				return i.minWidth;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args.reduce(function (a, i) {
					return Math.max(a, i);
				}, 0);
			}).pushAll(instance.minWidth);

			return [{
				top: headerI.minHeight,
				left: Stream.once(0),
				width: ctx.width,
				height: bodyI.minHeight,
			}, {
				top: Stream.once(0),
				left: Stream.once(0),
				width: ctx.width,
				height: headerI.minHeight,
			}];
		}),
	]);
};


var stickyHeaderBody = function (body1, header, body2) {
	return div.all([
		componentName('stickyHeaderBody'),
		child(body1),
		child(body2),
		child(header),
		wireChildren(function (instance, context, body1I, body2I, headerI) {
			Stream.combine([body1I, body2I, headerI].map(function (i) {
				return i.minHeight;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args.reduce(function (a, i) {
					return a + i;
				}, 0);
			}).pushAll(instance.minHeight);
			
			var fixedNow = false;
			
			return [{
				top: Stream.once(0),
				left: Stream.once(0),
				width: context.width,
				height: body1I.minHeight,
			}, {
				top: Stream.combine([body1I.minHeight, headerI.minHeight], function (a, b) {
					return a + b;
				}),
				left: Stream.once(0),
				width: context.width,
				height: body2I.minHeight,
			}, {
				top: Stream.combine([body1I.minHeight, context.scroll, context.topAccum], function (mh, scroll, topAccum) {
					var $header = headerI.$el;
					mh = Math.floor(mh);
					if (mh > scroll + topAccum) {
						$header.css('position', 'absolute');
						$header.css('transition', '');
						if (fixedNow) {
							window.scrollTo(0, mh + topAccum);
						}
						fixedNow = false;
						return mh;
					}
					else if (mh < scroll + topAccum) {
						$header.css('position', 'fixed');
						setTimeout(function () {
							$header.css('transition', 'inherit');
						}, 20);
						if (!fixedNow) {
							window.scrollTo(0, mh + topAccum);
						}
						fixedNow = true;
						return topAccum;
					}
				}),
				left: Stream.once(0),
				width: context.width,
				height: headerI.minHeight,
			}];
		}),
	]);
};


var grid = function (config, cs) {
	config.gutterSize = config.gutterSize || 0;
	config.handleSurplusWidth = config.handleSurplusWidth || ignoreSurplusWidth;
	config.handleSurplusHeight = config.handleSurplusHeight || ignoreSurplusHeight;
	
	return padding(config.outerGutter ? config.gutterSize : 0, div.all([
		componentName('grid'),
		children(cs),
		wireChildren(function (instance, context, is) {
			if (is.length === 0) {
				instance.minWidth.push(0);
				instance.minHeight.push(0);
			}
			var minWidths = Stream.combine(is.map(function (i) {
				return i.minWidth;
			}), function () {
				return Array.prototype.slice.call(arguments);
			});
			var minHeights = Stream.combine(is.map(function (i) {
				return i.minHeight;
			}), function () {
				return Array.prototype.slice.call(arguments);
			});

			minWidths.map(function (mws) {
				return mws.reduce(function (a, mw) {
					return Math.max(a, mw);
				}, 0);
			}).pushAll(instance.minWidth);

			var contexts = is.map(function (i) {
				return {
					top: Stream.never(),
					left: Stream.never(),
					width: Stream.never(),
					height: Stream.never(),
				};
			});

			var rowsStream = Stream.combine([
				context.width,
				minWidths], function (gridWidth, mws) {
					var blankRow = function () {
						return {
							cells: [],
							contexts: [],
							height: 0,
						};
					};

					var rowsAndCurrentRow = is.reduce(function (a, i, index) {
						var rows = a.rows;
						var currentRow = a.currentRow;
						
						var mw = mws[index];

						var widthUsedThisRow = currentRow.cells.reduce(function (a, b) {
							return a + b + config.gutterSize;
						}, -config.gutterSize);
						var widthNeeded = Math.min(mw, gridWidth);
						
						if (widthNeeded > 0 &&
							widthNeeded + widthUsedThisRow > gridWidth) {
							rows.push(currentRow);
							currentRow = blankRow();
						}

						currentRow.cells.push(widthNeeded);
						currentRow.contexts.push(contexts[index]);
						
						return {
							rows: rows,
							currentRow: currentRow,
						};
					}, {
						rows: [],
						currentRow: blankRow(),
					});
					var rows = rowsAndCurrentRow.rows;
					rows.push(rowsAndCurrentRow.currentRow);

					rows.map(function (row, i) {
						var widthUsed = 0;
						var positions = row.cells.map(function (widthNeeded) {
							var position = {
								left: widthUsed,
								width: widthNeeded,
							};
							widthUsed += widthNeeded + config.gutterSize;
							return position;
						});
						positions = config.handleSurplusWidth(gridWidth, positions, config, i);
						positions.map(function (position, index) {
							var ctx = row.contexts[index];
							ctx.width.push(position.width);
						});
					});
					
					return rows;
				});

			var rowsWithHeights = Stream.combine([
				minHeights,
				rowsStream,
			], function (mhs, rows) {
				var index = 0;
				rows.map(function (row) {
					row.height = 0;
					row.cells.map(function (cell, i) {
						row.height = Math.max(row.height, mhs[index + i]);
					});
					index += row.cells.length;
				});

				instance.minHeight.push(rows.map(function (r) {
					return r.height;
				}).reduce(function (a, b) { return a + b + config.gutterSize; }, -config.gutterSize));
				return rows;
			});

			
			Stream.all([
				context.width,
				context.height,
				rowsWithHeights], function (gridWidth, gridHeight, rows) {
					var top = 0;
					rows = config.handleSurplusHeight(gridHeight, rows, config);
					rows.map(function (row, i) {
						var widthUsed = 0;
						var positions = row.cells.map(function (widthNeeded) {
							var position = {
								top: top,
								left: widthUsed,
								width: widthNeeded,
								height: row.height,
							};
							widthUsed += widthNeeded + config.gutterSize;
							return position;
						});
						positions = config.handleSurplusWidth(gridWidth, positions, config, i);
						positions.map(function (position, index) {
							var ctx = row.contexts[index];
							ctx.top.push(position.top);
							ctx.left.push(position.left);
							ctx.width.push(position.width);
							ctx.height.push(position.height);
						});
						top += row.height + config.gutterSize;
					});
				});

			return [contexts];
		}),
	]));
};

var backgroundImagePosition = {
	fit: 'fit',
	fill: 'fill',
};

var withMinHeightStream = function (getMinHeightStream, c) {
	return div.all([
		componentName('with-min-height-stream'),
		child(c),
		wireChildren(function (instance, context, i) {
			getMinHeightStream(i, context).pushAll(instance.minHeight);
			i.minWidth.pushAll(instance.minWidth);
			return [{
				top: Stream.once(0),
				left: Stream.once(0),
				width: context.width,
				height: context.height,
			}];
		}),
	]);
};

var extendToWindowBottom = function (c, distanceStream) {
	distanceStream = distanceStream || Stream.once(0);
	return withMinHeightStream(function (instance, context) {
		return Stream.combine([instance.minHeight,
							   context.top,
							   context.topAccum,
							   distanceStream,
							   windowResize], function (mh, t, ta, distance) {
								   return Math.max(mh, window.innerHeight - t - ta - distance);
							   });
	}, c);
};

var overlays = function (cs) {
	return div.all([
		children(cs),
		wireChildren(function (instance, context, is) {
			var chooseLargest = function (streams) {
				return Stream.combine(streams, function () {
					var args = Array.prototype.slice.call(arguments);
					return args.reduce(function (a, v) {
						return Math.max(a, v);
					}, 0);
				});
			};

			chooseLargest(is.map(function (i) {
				return i.minHeight;
			})).test().pushAll(instance.minHeight);
			chooseLargest(is.map(function (i) {
				return i.minWidth;
			})).test().pushAll(instance.minWidth);
			return [
				is.map(function (i) {
					return {
						top: Stream.once(0),
						left: Stream.once(0),
						width: context.width,
						height: context.height,
					};
				}),
			];
		}),
	]);
};

var withBackground = function (background, c) {
	return div.all([
		componentName('with-background'),
		child(background),
		child(c),
		wireChildren(function (instance, context, bI, cI) {
			cI.minWidth.pushAll(instance.minWidth);
			cI.minHeight.pushAll(instance.minHeight);

			var ctx = {
				top: Stream.once(0),
				left: Stream.once(0),
				width: context.width,
				height: context.height,
			};
			return [
				ctx,
				ctx,
			];
		}),
	]);
};

var withBackgroundImage = function (config, c) {
	var imgAspectRatio = Stream.once(config.aspectRatio || 1);
	if (!config.src.map) {
		config.src = Stream.once(config.src);
	}
	return div.all([
		componentName('with-background-image'),
		$css('overflow', 'hidden'),
		child(img.all([
			$css('visibility', 'hidden'),
			function (i, context) {
				i.minWidth.push(0);
				i.minHeight.push(0);
				config.src.map(function (src) {
					i.$el.prop('src', src);
				});
				
				i.$el.on('load', function () {
					var nativeWidth = findMinWidth(i.$el);
					var nativeHeight = findMinHeight(i.$el);
					var aspectRatio = nativeWidth / nativeHeight;
					imgAspectRatio.push(aspectRatio);
				});
				Stream.all([context.width, context.height], function () {
					i.$el.css('visibility', '');
				});
			},
		])),
		child(c),
		wireChildren(function (instance, context, imgI, cI) {
			cI.minWidth.pushAll(instance.minWidth);
			cI.minHeight.pushAll(instance.minHeight);
			
			var ctx = instance.newCtx();
			context.top.push(0);
			context.left.push(0);
			context.width.pushAll(ctx.width);
			context.height.pushAll(ctx.height);
			
			var imgCtx = instance.newCtx();
			imgCtx.top.push(0);
			imgCtx.left.push(0);
			Stream.all([imgAspectRatio, context.width, context.height], function (aspectRatio, ctxWidth, ctxHeight) {
				var ctxAspectRatio = ctxWidth / ctxHeight;
				if (aspectRatio < ctxAspectRatio) {
					imgCtx.width.push(ctxWidth);
					imgCtx.height.push(ctxWidth / aspectRatio);
				}
				else {
					imgCtx.width.push(ctxHeight * aspectRatio);
					imgCtx.height.push(ctxHeight);
				}
			});
			
			return [
				imgCtx,
				ctx,
			];
		}),
	]);
};

var table = function (config, css) {
	config = config || {};
	var gutterSize = (config.paddingSize || 0) * 2;
	return div.all(css.map(function (cs) {
		return children(cs);
	})).all([
		componentName('table'),
		wireChildren(function () {
			var args = Array.prototype.slice.call(arguments);
			var instance = args[0];
			var context = args[1];
			var iss = args.slice(2);

			// we blindly assume all rows have the same number of columns
			
			// set table min width
			var maxMWs = Stream.combine(iss.reduce(function (a, is) {
				a.push(Stream.combine(is.map(function (i) {
					return i.minWidth;
				}), function () {
					return Array.prototype.slice.call(arguments);
				}));
				return a;
			}, []), function () {
				var rowMWs = Array.prototype.slice.call(arguments);
				return rowMWs.reduce(function (a, rowMWs) {
					return rowMWs.map(function (mw, i) {
						return Math.max(a[i] || 0, mw);
					});
				}, []);
			});
			maxMWs.map(function (maxMWs) {
				var mw = maxMWs.reduce(function (a, mw) {
					return a + mw + gutterSize;
				}, -gutterSize);
				instance.minWidth.push(mw);
			});

			// set table min height
			var rowMinHeights = iss.reduce(function (a, is) {
				a.push(Stream.combine(is.map(function (i) {
					return i.minHeight;
				}), function () {
					var args = Array.prototype.slice.call(arguments);
					return args.reduce(function (a, mh) {
						return Math.max(a, mh);
					}, 0);
				}));
				return a;
			}, []);
			Stream.combine(rowMinHeights, function () {
				var mhs = Array.prototype.slice.call(arguments);
				var mh = mhs.reduce(function (a, mh) {
					return a + mh + gutterSize;
				}, -gutterSize);
				instance.minHeight.push(mh);
			});

			return rowMinHeights.map(function (mh, i) {
				return iss[i].map(function (_, index) {
					return {
						width: maxMWs.map(function (maxMWs) {
							return maxMWs[index];
						}),
						height: rowMinHeights[i],
						top: Stream.combine(rowMinHeights.slice(0, i).concat([Stream.once(0)]), function () {
							var mhs = Array.prototype.slice.call(arguments);
							return mhs.reduce(function (a, mh) {
								return a + mh + gutterSize;
							}, -gutterSize);
						}),
						left: maxMWs.map(function (maxMWs) {
							return maxMWs.reduce(function (a, mw, mwI) {
								return a + (mwI < index ? mw + gutterSize : 0);
							}, 0);
						}),
					};
				});
			});
		}),
	]);
};

var tabs = function (list, stream) {
	var whichTab = stream || Stream.once(0);
	return stack({}, [
		sideBySide({}, list.map(function (item, index) {
			return alignTBM({
				bottom: toggleComponent([
					item.tab.left,
					item.tab.right,
					item.tab.selected,
				], whichTab.map(function (i) {
					if (index < i) {
						return 0;
					}
					if (index > i) {
						return 1;
					}
					return 2;
				})).all([
					link,
					clickThis(function () {
						whichTab.push(index);
					}),
				]),
			});
		})),
		componentStream(whichTab.map(function (i) {
			return list[i].content;
		})),
	]);
};


var matchStrings = function (stringsAndRouters) {
	return function (str) {
		for (var i = 0; i < stringsAndRouters.length; i++ ) {
			var stringAndRouter = stringsAndRouters[i];
			if (str.indexOf(stringAndRouter.string) === 0) {
				return stringAndRouter.router(str.substring(stringAndRouter.string.length));
			}
		}
	};
};

var routeToComponent = function (component) {
	return function () {
		return component;
	};
};

var routeToComponentF = function (componentF) {
	return function () {
		return componentF();
	};
};

var routeToFirst = function (routers) {
	return function (str) {
		for (var i = 0; i < routers.length; i++) {
			var result = routers[i](str);
			if (result) {
				return result;
			}
		}
	};
};

var routeMatchRest = function (f) {
	return function (str) {
		// wrapping in a promise catches any exceptions that f throws
		return Q(str).then(f);
	};
};

var route = function (router) {
	var i;
	return div.all([
		child(div.all([
			componentName('route'),
			function (instance, context) {
				windowHash.onValue(function (hash) {
					if (i) {
						i.destroy();
					}

					Q.all([router(hash)]).then(function (cs) {
						var c = cs[0];
						i = c.create(context);
						i.$el.css('transition', 'inherit');
						i.minWidth.pushAll(instance.minWidth);
						i.minHeight.pushAll(instance.minHeight);
					}, function (error) {
						console.error('child components failed to load');
						console.log(error);
					});
				});
			},
		])),
		wireChildren(passThroughToFirst),
	]);
};
