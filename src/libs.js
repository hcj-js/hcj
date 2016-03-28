var stream = stream || stream;
var add = function (a, b) {
	return a + b;
};
var mathMax = function (a, b) {
	return Math.max(a, b);
};
var mathMin = function (a, b) {
	return Math.min(a, b);
};
var passThroughToFirst = function (instance, context, i) {
	stream.pushAll(i.minHeight, instance.minHeight);
	stream.pushAll(i.minWidth, instance.minWidth);
	return [{
		width: context.width,
		height: context.height,
		top: stream.once(0),
		left: stream.once(0),
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



var debugPrintHeight = function (instance) {
	stream.map(instance.minHeight, function (mh) {
		console.log(mh);
		console.log(new Error().stack);
	});
};
var debugPrintWidth = function (instance) {
	stream.map(instance.minWidth, function (mw) {
		console.log(mw);
		console.log(new Error().stack);
	});
};


// $$ :: String -> [*] -> Component -> Component
// applies a jquery function to the component instance after creation
var $$ = function (func) {
	return function () {
		var args = Array.prototype.slice.call(arguments);
		return function (i) {
			i.$el[func].apply(i.$el, args);
			if (i.$el.hasClass('text') ||
				i.$el.hasClass('paragraph') ||
				i.$el.hasClass('image') ||
				'BUTTON' === i.$el.prop('tagName') ||
				'INPUT' === i.$el.prop('tagName') ||
				'TEXTAREA' === i.$el.prop('tagName')) {
				i.updateDimensions(true);
				if (!i.$el.hasClass('waiting-for-width')) {
					i.$el.addClass('waiting-for-width');
					// record old min width
					var mw = findMinWidth(i.$el);
					var initialWait = 1000;
					var exp = 1.1;
					// see if min width has changed
					var tryNewWidth = function (waitTime) {
						return function () {
							var mw2 = findMinWidth(i.$el);
							if (mw2 !== mw) {
								i.updateDimensions(true);
								i.$el.removeClass('waiting-for-width');
							}
							else {
								// exponential backoff
								setTimeout(tryNewWidth(waitTime * exp), waitTime);
							}
						};
					};
					// if width hasn't immediately changed, then wait
					setTimeout(tryNewWidth(initialWait));
				}
			}
		};
	};
};

var $addClass = $$('addClass');
var $css = $$('css');
var $attr = $$('attr');
var $prop = $$('prop');

var $cssC = liftCF($css);

var chooseHeightFromWidth = function (instance, context) {
	var choosingHeight = false;
	stream.onValue(context.width, function (w) {
		if (!choosingHeight) {
			choosingHeight = true;
			setTimeout(function () {
				var optimalHeight = findOptimalHeight(instance.$el, w);
				stream.push(instance.minHeight, optimalHeight);
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


var windowWidth = stream.never();
var windowHeight = stream.never();
var updateWindowWidth = function () {
	stream.push(windowWidth, document.documentElement.clientWidth);
};
var updateWindowHeight = function () {
	stream.push(windowHeight, window.innerHeight);
};
$(updateWindowWidth);
$(updateWindowHeight);
$(window).on('resize', function () {
	updateWindowWidth();
	updateWindowHeight();
});

var windowResize = stream.once(null);
$(window).on('resize', function (e) {
	stream.push(windowResize, e);
});

var windowScroll = stream.never();
$(window).on('scroll', function () {
	stream.push(windowScroll, window.scrollY);
});
stream.push(windowScroll, window.scrollY);

var windowHash = stream.never();
$(window).on('hashchange', function () {
	stream.push(windowHash, location.pathname);
});
stream.push(windowHash, location.pathname);


var withMinWidth = function (mw, end) {
	return function (i) {
		stream.push(i.minWidth, mw);
		if (end) {
			stream.end(i.minWidth);
		}
	};
};
var withMinHeight = function (mh, end) {
	return function (i) {
		stream.push(i.minHeight, mh);
		if (end) {
			stream.end(i.minHeight);
		}
	};
};
var adjustMinSize = function (config) {
	return function (c) {
		return div.all([
			child(c),
			wireChildren(function (instance, context, i) {
				stream.pushAll(stream.map(i.minWidth, function (mw) {
					return config.mw(mw);
				}), instance.minWidth);
				stream.pushAll(stream.map(i.minHeight, function (mh) {
					return config.mh(mh);
				}), instance.minHeight);
				return [{
					top: stream.once(0),
					left: stream.once(0),
					width: context.width,
					height: context.height,
				}];
			}),
		]);
	};
};
var link = function (i) {
	i.$el.css('cursor', 'pointer')
		.css('pointer-events', 'all');
};

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
					}, i);
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
var mousemoveThis = onThis('mousemove');
var mouseoverThis = onThis('mouseover');
var mouseoutThis = onThis('mouseout');
var mouseupThis = onThis('mouseup');
var submitThis = onThis('submit');

var hoverThis = function (cb) {
	return function (instance) {
		cb(false, instance);
		instance.$el.on('mouseover', function (ev) {
			cb(true, instance, ev);
		});
		instance.$el.on('mouseout', function (ev) {
			cb(false, instance, ev);
		});
	};
};

var hoverStream = function (s, f) {
	f = f || function (v) {
		return v;
	};
	return function (instance) {
		instance.$el.css('pointer-events', 'initial');
		instance.$el.on('mouseover', function (ev) {
			stream.push(s, f(ev));
			ev.stopPropagation();
		});
		$('body').on('mouseover', function (ev) {
			stream.push(s, f(false));
		});
	};
};

var cssStream = function (style, valueS) {
	return function (instance) {
		stream.map(valueS, function (value) {
			instance.$el.css(style, value);
		});
	};
};

var withBackgroundColor = function (s, arg2) {
	// stream is an object
	if (!stream.isStream(s)) {
		s = stream.once({
			backgroundColor: s,
			fontColor: arg2,
		});
	}
	return function (i, context) {
		stream.map(s, function (colors) {
			var bc = colors.backgroundColor;
			var fc = colors.fontColor;
			stream.push(context.backgroundColor, bc);
			setTimeout(function () {
				setTimeout(function () {
					var brightness = bc.a * colorBrightness(bc) +
							(1 - bc.a) * context.brightness.lastValue;
					stream.push(context.fontColor, fc || (brightness > 0.5 ? black : white));
				});
			});
		});
	};
};
var withFontColor = function (fc) {
	return function (i, context) {
		stream.push(context.fontColor, fc);
	};
};
var hoverColor = function (backgroundColor, hoverBackgroundColor, fontColor, hoverFontColor) {
	backgroundColor = colorString(backgroundColor || transparent);
	hoverBackgroundColor = colorString(hoverBackgroundColor || backgroundColor);
	fontColor = colorString(fontColor || black);
	hoverFontColor = colorString(hoverFontColor || fontColor);
	return hoverThis(function (h, instance) {
		instance.$el.css('background-color', h ? hoverBackgroundColor : backgroundColor);
		instance.$el.css('color', h ? hoverFontColor : fontColor);
	});
};

var keepAspectRatioCorner = function (config) {
	config = config || {};
	return function (c) {
		return div.all([
			$css('overflow', 'hidden'),
			child(c),
			wireChildren(function (instance, context, i) {
				stream.pushAll(i.minWidth, instance.minWidth);
				stream.pushAll(i.minHeight, instance.minHeight);

				var ctx = {
					top: stream.create(),
					left: stream.create(),
					width: stream.create(),
					height: stream.create(),
				};

				stream.combine([
					i.minWidth,
					i.minHeight,
					context.width,
					context.height,
				], function (mw, mh, w, h) {
					var ar = mw / mh;
					var AR = w / h;

					// container is wider
					if ((!config.fillSpace && AR > ar) ||
						(config.fillSpace && AR < ar)) {
						var usedWidth = h * ar;

						var left;
						if (config.left) {
							left = 0;
						}
						else if (config.right) {
							left = w - usedWidth;
						}
						else {
							left = (w - usedWidth) / 2;
						}

						stream.push(ctx.top, 0);
						stream.push(ctx.left, left);
						stream.push(ctx.width, usedWidth);
						stream.push(ctx.height, h);
					}
					// container is taller
					else {
						var usedHeight = w / ar;

						var top;
						if (config.top) {
							top = 0;
						}
						else if (config.bottom) {
							top = h - usedHeight;
						}
						else {
							top = (h - usedHeight) / 2;
						}

						stream.push(ctx.top, top);
						stream.push(ctx.left, 0);
						stream.push(ctx.width, w);
						stream.push(ctx.height, usedHeight);
					}
				});

				return [ctx];
			}),
		]);
	};
};

var keepAspectRatio = keepAspectRatioCorner();
var keepAspectRatioFill = keepAspectRatioCorner({
	fillSpace: true,
});

var image = function (config) {
	var srcStream = stream.isStream(config.src) ? config.src : stream.once(config.src);
	return img.all([
		componentName('image'),
		$css('pointer-events', 'all'),
		function (i, context) {
			stream.map(srcStream, function (src) {
				i.$el.prop('src', src);
			});
			i.$el.css('display', 'none');

			i.$el.on('load', function () {
				i.$el.css('display', '');
				var nativeWidth = i.$el[0].naturalWidth;
				var nativeHeight = i.$el[0].naturalHeight;
				var aspectRatio = nativeWidth / nativeHeight;

				var initialMinWidth =
					config.minWidth ||
					config.chooseWidth ||
					nativeWidth;
				var initialMinHeight =
					config.minHeight ||
					config.chooseHeight ||
					(initialMinWidth / aspectRatio);
				stream.push(i.minWidth, initialMinWidth);
				stream.push(i.minHeight, initialMinHeight);

				var minWidth, minHeight;

				if (config.minWidth !== undefined && config.minWidth !== null) {
					minWidth = config.minWidth;
					minHeight = minWidth / aspectRatio;
					stream.push(i.minWidth, minWidth);
					stream.push(i.minHeight, minHeight);
				}
				else if (config.minHeight !== undefined && config.minHeight !== null) {
					minHeight = config.minHeight;
					minWidth = minHeight * aspectRatio;
					stream.push(i.minWidth, minWidth);
					stream.push(i.minHeight, minHeight);
				}
				else if (config.useNativeWidth) {
					stream.push(i.minWidth, nativeWidth);
					stream.push(i.minHeight, nativeHeight);
				}
				else {
					stream.push(i.minWidth, nativeWidth);
				}
				if (!config.useNativeWidth) {
					stream.pushAll(stream.map(context.width, function (width) {
						return width / aspectRatio;
					}), i.minHeight);
				}
			});
		},
	]);
};

var linkTo = function (href, c) {
	return a.all([
		$prop('href', href),
		child(c.all([
			$css('pointer-events', 'initial'),
		])),
		wireChildren(passThroughToFirst),
	]);
};

var nothing = div.all([
	componentName('nothing'),
	withMinHeight(0),
	withMinWidth(0),
]);

var text = function (text) {
	if (!stream.isStream(text)) {
		text = stream.once(text);
	}

	return div.all([
		componentName('text'),
		$css('pointer-events', 'all'),
		$css('white-space', 'nowrap'),
		function (instance, context) {
			chooseHeightFromWidth(instance, context);
			stream.onValue(text, function (t) {
				if (t) {
					while (t.indexOf(' ') !== -1) {
						t = t.replace(' ', '&nbsp;');
					}
				}
				instance.$el.html(t);
				stream.push(instance.minWidth, findMinWidth(instance.$el));
			});
		},
	]);
};
var faIcon = function (str) {
	return text('<i class="fa fa-' + str + '"></i>');
};
var paragraph = function (text, minWidth) {
	if (!stream.isStream(text)) {
		text = stream.once(text);
	}

	minWidth = minWidth || 0;

	return div.all([
		componentName('paragraph'),
		$css('pointer-events', 'all'),
		function (instance, context) {
			chooseHeightFromWidth(instance, context);
			instance.updateDimensions = function () {
				stream.push(instance.minWidth, findScrollWidth(instance.$el, minWidth));
			};
			stream.onValue(text, function (t) {
				instance.$el.html(t);
				instance.updateDimensions();
			});
			stream.combine([
				text,
				context.width,
			], function (text, w) {
				var optimalHeight = findOptimalHeight(instance.$el, w);
				stream.push(instance.minHeight, optimalHeight);
			});
		},
	]);
};

var ignoreSurplusWidth = function (_, cols) {
	return cols;
};
var ignoreSurplusHeight = function (_, rows) {
	return rows;
};
var centerSurplusWidth = function (gridWidth, positions) {
	var lastPosition = positions[positions.length - 1];
	var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
	var widthPerCol = surplusWidth / positions.length;
	positions.map(function (position, i) {
		position.left += surplusWidth / 2;
	});
	return positions;
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
// don't read this function, please
var evenSplitSurplusWidthWithMinPerRow = function (minPerRow) {
	return function (gridWidth, positions) {
		var lastPosition = positions[positions.length - 1];
		var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
		var widthPerCol = gridWidth / Math.max(minPerRow, positions.length);
		positions.map(function (position, i) {
			position.width = widthPerCol;
			position.left = i * widthPerCol;
		});
		lastPosition = positions[positions.length - 1];
		surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
		widthPerCol = surplusWidth / positions.length;
		positions.map(function (position, i) {
			position.left += surplusWidth / 2;
		});
		return positions;
	};
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
var surplusWidthAlign = function (t) {
	return function (gridWidth, positions) {
		var lastPosition = positions[positions.length - 1];
		var surplusWidth = gridWidth - (lastPosition.left + lastPosition.width);
		positions.map(function (position, i) {
			position.left += t * surplusWidth;
		});
		return positions;
	};
};
var surplusWidthAlignLeft = surplusWidthAlign(0);
var surplusWidthAlignCenter = surplusWidthAlign(0.5);
var surplusWidthAlignRight = surplusWidthAlign(1);
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

var centerSurplusHeight = function (totalHeight, positions) {
	var lastPosition = positions[positions.length - 1];
	var surplusHeight = totalHeight - (lastPosition.top + lastPosition.height);
	positions.map(function (position, i) {
		position.top += surplusHeight / 2;
	});
	return positions;
};
var giveHeightToNth = function (n) {
	return function (totalHeight, positions) {
		var lastPosition = positions[positions.length - 1];
		var surplusHeight = totalHeight - (lastPosition.top + lastPosition.height);
		positions.map(function (position, i) {
			if (i === n || (i === positions.length - 1 && n >= positions.length)) {
				position.height += surplusHeight;
			}
			else if (i > n) {
				position.top += surplusHeight;
			}
		});
		return positions;
	};
};
var giveHeightToLast = function (totalHeight, positions) {
	var n = positions.length - 1;
	var lastPosition = positions[positions.length - 1];
	var surplusHeight = totalHeight - (lastPosition.top + lastPosition.height);
	positions.map(function (position, i) {
		if (i === n || (i === positions.length - 1 && n >= positions.length)) {
			position.height += surplusHeight;
		}
		else if (i > n) {
			position.top += surplusHeight;
		}
	});
	return positions;
};
var slideshow = function (config, cs) {
	config.gutterSize = config.gutterSize || 0;
	config.leftTransition = config.leftTransition || 'none';
	config.alwaysFullWidth = config.alwaysFullWidth || false;
	return div.all([
		$css('overflow', 'hidden'),
		componentName('slideshow'),
		children(cs.map(function (c) {
			return c.all([
				$css('transition', 'left ' + config.leftTransition),
			]);
		})),
		wireChildren(function (instance, context, is) {
			var allMinWidths = stream.combine(is.map(function (i) {
				return i.minWidth;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args;
			});

			stream.onValue(allMinWidths, function (mws) {
				stream.push(instance.minWidth, mws.reduce(add, config.gutterSize * (is.length - 1)));
			});

			var contexts = is.map(function () {
				return {
					top: stream.once(0),
					left: stream.never(),
					width: stream.never(),
					height: context.height,};});

			stream.all([config.selectedS, context.width, allMinWidths], function (selected, width, mws) {
				var selectedLeft = 0;
				var selectedWidth = 0;
				var left = 0;
				var positions = mws.map(function (mw, index) {
					mw = config.alwaysFullWidth ? width : mw;
					if (selected === index) {
						selectedLeft = left + config.gutterSize * index;
						selectedWidth = mw;
					}
					var position = {
						left: left + config.gutterSize * index,
						width: mw };
					left += mw;
					return position;
				});
				var dLeft = (width - selectedWidth) / 2 - selectedLeft;
				positions.map(function (position) {
					position.left += dLeft;
				});

				positions.map(function (position, index) {
					var ctx = contexts[index];
					stream.push(ctx.left, position.left);
					stream.push(ctx.width, position.width);
				});
			});

			stream.pushAll(stream.combine(is.map(function (i) {
				return i.minHeight;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				var height = args.reduce(mathMax, 0);

				contexts.map(function (ctx) {
					stream.push(ctx.height, height);
				});

				return height;
			}), instance.minHeight);

			return [contexts];
		}),
	]);
};
var slideshowVertical = function (config, cs) {
	config.gutterSize = config.gutterSize || 0;
	config.topTransition = config.topTransition || 'none';
	config.alwaysFullHeight = config.alwaysFullHeight || false;
	return div.all([
		$css('overflow', 'hidden'),
		componentName('slideshow'),
		children(cs.map(function (c) {
			return c.all([
				$css('transition', 'top ' + config.topTransition),
			]);
		})),
		wireChildren(function (instance, context, is) {
			var allMinHeights = stream.combine(is.map(function (i) {
				return i.minHeight;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args;
			});

			stream.onValue(allMinHeights, function (mhs) {
				stream.push(instance.minHeight, mhs.reduce(mathMax, 0));
			});

			var contexts = is.map(function (i) {
				return {
					top: stream.never(),
					left: stream.once(0),
					width: context.width,
					height: i.minHeight,
				};
			});

			stream.all([
				config.selected,
				context.height,
				allMinHeights
			], function (selected, height, mhs) {
				var selectedTop = 0;
				var selectedHeight = 0;
				var top = 0;
				var positions = mhs.map(function (mh, index) {
					mh = config.alwaysFullHeight ? height : mh;
					if (selected === index) {
						selectedTop = top + config.gutterSize * index;
						selectedHeight = mh;
					}
					var position = {
						top: top + config.gutterSize * index,
						height: mh
					};
					top += mh;
					return position;
				});
				var dTop = (height - selectedHeight) / 2 - selectedTop;
				positions.map(function (position) {
					position.top += dTop;
				});

				positions.map(function (position, index) {
					var ctx = contexts[index];
					stream.push(ctx.top, position.top);
					stream.push(ctx.height, position.height);
				});
			});

			stream.pushAll(stream.combine(is.map(function (i) {
				return i.minWidth;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				var width = args.reduce(mathMax, 0);

				return width;
			}), instance.minWidth);

			return [contexts];
		}),
	]);
};

var sideBySide = function (config, cs) {
	config.gutterSize = config.gutterSize || 0;
	config.handleSurplusWidth = config.handleSurplusWidth || ignoreSurplusWidth;
	return div.all([
		componentName('sideBySide'),
		children(cs),
		wireChildren(function (instance, context, is) {
			var allMinWidths = stream.combine(is.map(function (i) {
				return i.minWidth;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args;
			});

			stream.onValue(allMinWidths, function (mws) {
				stream.push(instance.minWidth, mws.reduce(add, config.gutterSize * (is.length - 1)));
			});

			var contexts = is.map(function () {
				return {
					top: stream.once(0),
					left: stream.never(),
					width: stream.never(),
					height: context.height,
				};
			});

			stream.all([context.width, allMinWidths], function (width, mws) {
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
					stream.push(ctx.left, position.left);
					stream.push(ctx.width, position.width);
				});
			});

			stream.pushAll(stream.combine(is.map(function (i) {
				return i.minHeight;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args.reduce(mathMax, 0);
			}), instance.minHeight);

			return [contexts];
		}),
	]);
};

var slider = function (config, cs) {
	config = config || {};
	config.leftTransition = config.leftTransition || '0s';
	var grabbedS = stream.once(false);
	var edge = {
		left: 'left',
		right: 'right',
	};
	var stateS = stream.once({
		index: 0,
		edge: 'left',
	});
	var xCoord = 0;
	return div.all([
		componentName('slider'),
		$css('overflow-x', 'hidden'),
		$css('cursor', 'move'),
		children(cs),
		wireChildren(function (instance, context, is) {
			var allMinWidths = stream.combine(is.map(function (i) {
				return i.minWidth;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args;
			});
			var totalMinWidthS = stream.map(allMinWidths, function (mws) {
				return mws.reduce(add, 0);
			});
			stream.onValue(allMinWidths, function (mws) {
				stream.push(instance.minWidth, mws.reduce(mathMax, 0));
			});

			stream.pushAll(stream.combine(is.map(function (i) {
				return i.minHeight;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args.reduce(mathMax, 0);
			}), instance.minHeight);

			var leftS = stream.combine([
				context.width,
				allMinWidths,
				stateS,
				grabbedS
			], function (width, mws, state, grabbed) {
				// configure left to be the left parameter of the first article in the slider
				var left = state.edge === 'left' ? 0 : width; // would love to case split
				mws.map(function (mw, index) {
					if (index < state.index) {
						left -= mw;
					}
					if (state.edge === 'right' && index === state.index) {
						left -= mw;
					}
				});
				if (grabbed !== false) {
					left += grabbed;
				}
				return left;
			});

			var leftsS = stream.combine([
				allMinWidths,
				leftS,
			], function (mws, left) {
				return mws.reduce(function (acc, v) {
					acc.arr.push(acc.lastValue);
					acc.lastValue += v;
					return acc;
				}, {
					arr: [],
					lastValue: left,
				}).arr;
			});

			instance.$el.css('user-select', 'none');
			instance.$el.on('mousedown', function (ev) {
				ev.preventDefault();
				stream.push(grabbedS, 0);
				is.map(function (i) {
					i.$el.css('transition', 'left 0s');
				});
			});
			var release = function (ev) {
				is.map(function (i) {
					i.$el.css('transition', 'left ' + config.leftTransition);
				});
				var mws = allMinWidths.lastValue;
				var width = context.width.lastValue;
				var grabbed = grabbedS.lastValue;
				if (!grabbed) {
					return;
				}
				var left = leftS.lastValue;
				// array of sums of min widths
				var edgeScrollPoints = mws.reduce(function (a, mw) {
					var last = a[a.length - 1];
					a.push(last - mw);
					return a;
				}, [0]);
				var closest = edgeScrollPoints.reduce(function (a, scrollPoint, index) {
					var leftDistanceHere = Math.abs(scrollPoint - left);
					var rightDistanceHere = Math.abs(scrollPoint - (left - width));
					return {
						left: leftDistanceHere < a.left.distance ? {
							distance: leftDistanceHere,
							index: index,
						} : a.left,
						right: rightDistanceHere < a.right.distance ? {
							distance: rightDistanceHere,
							index: index - 1,
						} : a.right,
					};
				}, {
					left: {
						distance: Number.MAX_VALUE,
						index: -1,
					},
					right: {
						distance: Number.MAX_VALUE,
						index: -1,
					},
				});
				if (closest.left.distance <= closest.right.distance) {
					stream.push(stateS, {
						index: closest.left.index,
						edge: 'left',
					});
				}
				else {
					stream.push(stateS, {
						index: closest.right.index,
						edge: 'right',
					});
				}
				stream.push(grabbedS, false);
				ev.preventDefault();
			};
			instance.$el.on('mouseup', release);
			instance.$el.on('mouseout', release);
			instance.$el.on('mousemove', function (ev) {
				var grabbed = grabbedS.lastValue;
				var totalMinWidth = totalMinWidthS.lastValue;
				var width = context.width.lastValue;
				var left = leftS.lastValue;
				if (grabbed !== false) {
					var dx = ev.clientX - xCoord;
					var left2 = left + dx;
					left2 = Math.min(0, left2);
					if (totalMinWidth > width) {
						left2 = Math.max(width - totalMinWidth, left2);
					}
					dx = left2 - left;
					grabbed = grabbed + dx;
					stream.push(grabbedS, grabbed);
				}
				xCoord = ev.clientX;
			});

			return [is.map(function (i, index) {
				return {
					top: stream.once(0),
					left: stream.map(leftsS, function (lefts) {
						return lefts[index];
					}),
					width: i.minWidth,
					height: context.height,
				};
			})];
		}),
	]);
};

var stack2 = function (config, cs) {
	config.gutterSize = config.gutterSize || 0;
	config.handleSurplusHeight = config.handleSurplusHeight || ignoreSurplusHeight;
	return div.all([
		componentName('stack2'),
		children(cs),
		wireChildren(function (instance, context, is) {
			var allMinHeights = stream.combine(is.map(function (i) {
				return i.minHeight;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args;
			});

			stream.onValue(allMinHeights, function (mhs) {
				stream.push(instance.minHeight, mhs.reduce(add, config.gutterSize * (is.length - 1)));
			});

			var contexts = is.map(function () {
				return {
					top: stream.create(),
					left: stream.once(0),
					width: context.width,
					height: stream.never(),
				};
			});

			stream.all([context.height, allMinHeights], function (height, mhs) {
				var top = 0;
				var positions = mhs.map(function (mh, index) {
					var position = {
						top: top + config.gutterSize * index,
						height: mh,
					};
					top += mh;
					return position;
				});
				positions = config.handleSurplusHeight(height, positions);

				positions.map(function (position, index) {
					var ctx = contexts[index];
					stream.push(ctx.top, position.top);
					stream.push(ctx.height, position.height);
				});
			});

			stream.pushAll(stream.combine(is.map(function (i) {
				return i.minWidth;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args.reduce(mathMax, 0);
			}), instance.minWidth);

			return [contexts];
		}),
	]);
};

var intersperse = function (arr, v) {
	var result = [];
	stream.map(arr, function (el) {
		stream.push(result, el);
		stream.push(result, v);
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

			stream.push(instance.minHeight, 0);
			stream.push(instance.minWidth, 0);

			stream.pushAll(stream.combine([
				i1.minHeight,
				i2.minHeight,
			], function (mh1, mh2) {
				return mh1 + mh2 + gutterSize;
			}), instance.minHeight);

			stream.pushAll(stream.combine([
				i1.minWidth,
				i2.minWidth,
			], function (mw1, mw2) {
				return Math.max(mw1, mw2);
			}), instance.minWidth);

			return [[{
				top: stream.once(0),
				left: stream.once(0),
				width: context.width,
				height: i1.minHeight,
			}, {
				top: stream.map(i1.minHeight, function (mh) {
					return mh + gutterSize;
				}),
				left: stream.once(0),
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
	if (cs.length === 0) {
		cs = [nothing];
	}
	return div.all([
		componentName('stack'),
		children(cs),
		wireChildren(function (instance, context, is) {
			var gutterSize = (options && options.gutterSize) || 0;
			var totalMinHeightStream = function (is) {
				if (is.length === 0) {
					return stream.once(0);
				}
				return stream.combine(is.map(function (i, index) {
					var iMinHeight;

					if (options && options.mhs && options.mhs[index]) {
						var optionMinHeight = options.mhs[index](context);
						return stream.combine([i.minHeight, optionMinHeight], mathMax);
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
				var top = stream.map(totalMinHeightStream(is), function (t) {
					return t + ((index === 0 || (options.collapseGutters && t === 0)) ? 0 : gutterSize);
				});
				var iMinHeight;

				if (options && options.mhs && options.mhs[is.length]) {
					var optionMinHeight = options.mhs[is.length](context);
					iMinHeight = stream.combine([i.minHeight, optionMinHeight], mathMax);
				}
				else {
					iMinHeight = i.minHeight;
				}

				contexts.push({
					top: top,
					left: stream.once(0),
					width: context.width,
					height: iMinHeight,
				});

				is.push(i);
				return is;
			}, []);

			stream.pushAll(totalMinHeightStream(is), instance.minHeight);
			stream.pushAll(stream.combine(is.map(function (i) {
				return i.minWidth;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args.reduce(mathMax, 0);
			}), instance.minWidth);

			return [contexts];
		}),
	]);
};

var adjustPosition = function (amount, c) {
	var top = amount.top || 0;
	var left = amount.left || 0;
	var expand = amount.expand;
	return div.all([
		componentName('adjustPosition'),
		child(c),
		wireChildren(function (instance, context, i) {
			stream.pushAll(stream.map(i.minWidth, function (w) {
				return w + expand ? left : 0;
			}), instance.minWidth);
			stream.pushAll(stream.map(i.minHeight, function (h) {
				return h + expand ? top : 0;
			}), instance.minHeight);
			return [{
				top: stream.map(context.top, function (t) {
					return t + top;
				}),
				left: stream.map(context.left, function (l) {
					return l + left;
				}),
				width: context.width,
				height: context.height,
			}];
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
			if (amount[key] !== null) {
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
	}
	return div.all([
		componentName('padding'),
		child(c),
		wireChildren(function (instance, context, i) {
			stream.pushAll(stream.map(i.minWidth, function (mw) {
				return mw + left + right;
			}), instance.minWidth);

			stream.pushAll(stream.map(i.minHeight, function (mh) {
				return mh + top + bottom;
			}), instance.minHeight);

			return [{
				top: stream.once(top),
				left: stream.once(left),
				width: stream.map(context.width, function (w) {
					return w - left - right;
				}),
				height: stream.map(context.height, function (h) {
					return h - top - bottom;
				}),
			}];
		}),
	]);
};

var margin = function (amount) {
	return function (c) {
		return padding(amount, c);
	};
};

// TODO: change this name quick, before there are too many
// dependencies on it
var expandoStream = function (amountS, c) {
	var topS = stream.create();
	var bottomS = stream.create();
	var leftS = stream.create();
	var rightS = stream.create();
	stream.map(amountS, function (amount) {
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
				if (amount[key] !== null) {
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
		}
		stream.push(topS, top);
		stream.push(bottomS, bottom);
		stream.push(leftS, left);
		stream.push(rightS, right);
	});
	return div.all([
		componentName('expando-stream'),
		child(c),
		wireChildren(function (instance, context, i) {
			var ctx = instance.newCtx();

			stream.combine([
				i.minWidth,
				leftS,
				rightS,
			], function (mw, l, r) {
				stream.push(instance.minWidth, mw);
			});
			stream.combine([
				leftS,
				rightS,
				context.width,
			], function (l, r, W) {
				stream.push(ctx.left, l);
				stream.push(ctx.width, W - l - r);
			});
			stream.combine([
				i.minHeight,
				topS,
				bottomS,
			], function (mh, t, b) {
				stream.push(instance.minHeight, mh);
			});
			stream.combine([
				topS,
				bottomS,
				context.height,
			], function (t, b, H) {
				stream.push(ctx.top, t);
				stream.push(ctx.height, H - t - b);
			});

			return [ctx];
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
			var headerHeight = stream.combine([mI, lI, rI].map(function (i) {
				return i.minHeight;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				var height = args.reduce(function (h, mh) {
					return Math.max(h, mh);
				}, 0);
				return height;
			});
			stream.pushAll(headerHeight, instance.minHeight);

			stream.pushAll(stream.combine([mI, lI, rI].map(function (i) {
				return i.minWidth;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				var height = args.reduce(function (w, mw) {
					return w + mw;
				}, 0);
				return height;
			}), instance.minWidth);

			var minAvailableRequested = function (available, requested) {
				return stream.combine([available, requested], mathMin);
			};
			var mWidth = minAvailableRequested(context.width, mI.minWidth);
			var lWidth = minAvailableRequested(context.width, lI.minWidth);
			var rWidth = minAvailableRequested(context.width, rI.minWidth);

			return [{
				top: stream.once(0),
				left: stream.combine([context.width, mWidth], function (width, mw) {
					return (width - mw) / 2;
				}),
				width: mWidth,
				height: context.height,
			}, {
				top: stream.once(0),
				left: stream.once(0),
				width: lWidth,
				height: context.height,
			}, {
				top: stream.once(0),
				left: stream.combine([context.width, rWidth], function (width, rMW) {
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
			var minWidth = stream.combine([mI, bI, tI].map(function (i) {
				return i.minWidth;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				var width = args.reduce(function (w, mw) {
					return Math.max(w, mw);
				}, 0);
				return width;
			});
			stream.pushAll(minWidth, instance.minWidth);

			stream.pushAll(stream.combine([mI, bI, tI].map(function (i) {
				return i.minHeight;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				var height = args.reduce(function (h, mh) {
					return h + mh;
				}, 0);
				return height;
			}), instance.minHeight);

			return [{
				top: stream.combine([context.height, mI.minHeight], function (height, mh) {
					return (height - mh) / 2;
				}),
				left: stream.once(0),
				width: context.width,
				height: mI.minHeight,
			}, {
				top: stream.combine([context.height, bI.minHeight], function (height, mh) {
					return height - mh;
				}),
				left: stream.once(0),
				width: context.width,
				height: bI.minHeight,
			}, {
				top: stream.once(0),
				left: stream.once(0),
				width: context.width,
				height: tI.minHeight,
			}];
		}),
	]);
};
var invertOnHover = function (c) {
	var invert = stream.once(false, 'invert');
	
	var choose = function (stream1, stream2) {
		return stream.combine([invert, stream1, stream2], function (i, v1, v2) {
			return i ? v2 : v1;
		}, 'choose stream');
	};
	
	
	return div.all([
		componentName('invert-on-hover'),
		child(c.and($css('transition', 'background-color 0.2s linear, color 0.1s linear'))),
		wireChildren(function (instance, context, i) {
			stream.pushAll(i.minHeight, instance.minHeight);
			stream.pushAll(i.minWidth, instance.minWidth);
			return [{
				backgroundColor: choose(context.backgroundColor, context.fontColor),
				fontColor: choose(context.fontColor, context.backgroundColor),
				top: stream.once(0),
				left: stream.once(0),
				width: context.width,
				height: context.height,
			}];
		}),
		mouseoverThis(function () {
			stream.push(invert, true);
		}),
		mouseoutThis(function () {
			stream.push(invert, false);
		}),
	]);
};

var border = function (colorS, amount, c) {
	var left = amount.left || amount.all || 0;
	var right = amount.right || amount.all || 0;
	var top = amount.top || amount.all || 0;
	var bottom = amount.bottom || amount.all || 0;
	var radius = amount.radius || 0;

	if (!colorS.onValue) {
		colorS = stream.once(colorS);
	}

	var colorStringS = stream.map(colorS, colorString);

	return div.all([
		componentName('border'),
		child(div.all([
			componentName('border-child'),
			$css('border-radius', px(radius)),
			child(c),
			wireChildren(passThroughToFirst),
		])),
		function (i) {
			stream.map(colorStringS, function (colorstring) {
				i.$el.css('border-left', px(left) + ' solid ' + colorstring);
				i.$el.css('border-right', px(right) + ' solid ' + colorstring);
				i.$el.css('border-top', px(top) + ' solid ' + colorstring);
				i.$el.css('border-bottom', px(bottom) + ' solid ' + colorstring);
			});
		},
		wireChildren(function (instance, context, i) {
			stream.pushAll(stream.map(i.minWidth, function (mw) {
				return mw + left + right;
			}), instance.minWidth);

			stream.pushAll(stream.map(i.minHeight, function (mh) {
				return mh + top + bottom;
			}), instance.minHeight);

			return [{
				top: stream.once(0),
				left: stream.once(0),
				width: stream.map(context.width, function (w) {
					return w - left - right;
				}),
				height: stream.map(context.height, function (h) {
					return h - top - bottom;
				}),
			}];
		}),
	]);
};

var componentStream = function (cStream) {
	var i;
	return div.all([
		componentName('component-stream'),
		function (instance, context) {
			var ctx = instance.newCtx();
			stream.push(ctx.top, 0);
			stream.push(ctx.left, 0);
			stream.pushAll(context.width, ctx.width);
			stream.pushAll(context.height, ctx.height);

			var localCStream = stream.create();
			stream.pushAll(cStream, localCStream);
			stream.map(localCStream, function (c) {
				var instanceC = function (c) {
					if (i) {
						i.destroy();
					}
					i = c.create(ctx);
					i.$el.css('transition', 'inherit');
					stream.pushAll(i.minWidth, instance.minWidth);
					stream.pushAll(i.minHeight, instance.minHeight);
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
				stream.end(localCstream);
				if (i) {
					i.destroy();
				}
			};
		},
	]);
};

var componentStreamWithExit = function (cStream, exit) {
	var i;
	return div.all([
		componentName('component-stream'),
		function (instance, context) {
			var localCStream = stream.create();
			stream.pushAll(cStream, localCStream);
			stream.map(localCStream, function (c) {
				var ctx = instance.newCtx();
				stream.push(ctx.top, 0);
				stream.push(ctx.left, 0);
				stream.pushAll(context.width, ctx.width);
				stream.pushAll(context.height, ctx.height);

				var instanceC = function (c) {
					if (i) {
						(function (i) {
							setTimeout(function () {
								exit(i).then(function () {
									i.destroy();
								});
							});
						})(i);
					}
					i = c.create(ctx);
					i.$el.css('transition', 'inherit');
					stream.pushAll(i.minWidth, instance.minWidth);
					stream.pushAll(i.minHeight, instance.minHeight);
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
				stream.end(localCstream);
				if (i) {
					i.destroy();
				}
			};
		},
	]);
};

var promiseComponent = function (cP) {
	var s = stream.once(nothing);
	cP.then(function (c) {
		stream.push(s, c);
	}, function (error) {
		console.log(error);
	}).catch(function (err) {
		console.log(err);
	});
	return componentStream(s);
};

var toggleComponent = function (cs, indexStream) {
	return componentStream(stream.map(indexStream, function (i) {
		return cs[i];
	}));
};

var modalDialog = function (c) {
	return function (s, transition) {
		var open = stream.once(false);
		stream.pushAll(s, open);

		transition = transition || 0;

		return div.all([
			$css('z-index', 100),
			componentName('toggle-height'),
			child(c),
			wireChildren(function (instance, context, i) {
				stream.push(instance.minWidth, 0);
				stream.push(instance.minHeight, 0);

				var $el = i.$el;
				$el.css('position', 'fixed');
				$el.css('transition', $el.css('transition') + ', opacity ' + transition + 's');
				$el.css('display', 'none');
				$el.css('pointer-events', 'initial');

				stream.onValue(open, function (on) {
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
					width: stream.map(windowWidth, function () {
						return window.innerWidth;
					}),
					height: windowHeight,
					left: stream.once(0),
					top: stream.once(0),
				}];
			}),
		]);
	};
};

var toggleHeight = function (s) {
	var open = stream.once(false);
	stream.pushAll(s, open);
	return function (c) {
		return div.all([
			$css('overflow', 'hidden'),
			componentName('toggle-height'),
			child(c),
			wireChildren(function (instance, context, i) {
				stream.pushAll(i.minWidth, instance.minWidth);
				stream.pushAll(stream.combine([i.minHeight, open], function (mh, onOff) {
					return onOff ? mh : 0;
				}), instance.minHeight);
				return [{
					top: stream.once(0),
					left: stream.once(0),
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
		child(div.all([
			child(panel),
			wireChildren(function (instance, context, i) {
				stream.pushAll(i.minWidth, instance.minWidth);
				stream.pushAll(i.minHeight, instance.minHeight);
				i.$el.css('transition', 'top ' + config.transition);
				instance.$el.css('pointer-events', 'none');
				i.$el.css('pointer-events', 'initial');
				i.$el.css('z-index', '1000');
				return [{
					width: context.width,
					height: i.minHeight,
					top: stream.combine([onOff, i.minHeight], function (on, mh) {
						return on ? 0 : -mh;
					}),
					left: stream.once(0),
				}];
			}),
			$css('overflow', 'hidden'),
		])),
		child(source),
		wireChildren(function (instance, context, iPanel, iSource) {
			stream.pushAll(stream.combine([
				iPanel.minWidth,
				iSource.minWidth,
			], Math.max), instance.minWidth);
			stream.pushAll(iSource.minHeight, instance.minHeight);
			if (config.panelHeightS) {
				stream.pushAll(iPanel.minHeight, config.panelHeightS);
			}
			return [{
				width: context.width,
				height: iPanel.minHeight,
				top: iSource.minHeight,
				left: stream.once(0),
			}, {
				width: context.width,
				height: iSource.minHeight,
				top: stream.once(0),
				left: stream.once(0),
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

			stream.pushAll(stream.map(stream.combine([bodyI, headerI], function (i) {
				return i.minHeight;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args.reduce(add, 0);
			}), instance.minHeight);

			stream.pushAll(stream.map(stream.combine([bodyI, headerI], function (i) {
				return i.minWidth;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args.reduce(mathMax, 0);
			}), instance.minWidth);

			return [{
				top: headerI.minHeight,
				left: stream.once(0),
				width: ctx.width,
				height: bodyI.minHeight,
			}, {
				top: stream.once(0),
				left: stream.once(0),
				width: ctx.width,
				height: headerI.minHeight,
			}];
		}),
	]);
};

var makeSticky = function (c) {
	return div.all([
		componentName('stickyHeaderBody'),
		child(c),
		wireChildren(function (instance, context, i) {
			stream.pushAll(i.minWidth, instance.minWidth);
			stream.pushAll(i.minHeight, instance.minHeight);

			return [{
				top: stream.once(0),
				left: stream.combine([
					i.minHeight,
					context.scroll,
					context.top,
					context.left,
					context.leftAccum,
				], function (mh, scroll, top, left, leftAccum) {
					var $el = i.$el;
					if (top > scroll) {
						$el.css('position', 'absolute');
						$el.css('transition', '');
						return 0;
					}
					else if (top < scroll) {
						var leftPosition = left + leftAccum;
						$el.css('position', 'fixed');
						$el.css('left', px(leftPosition));
						setTimeout(function () {
							$el.css('transition', 'inherit');
						}, 20);
						return leftPosition;
					}
				}),
				width: context.width,
				height: context.height,
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
			stream.pushAll(stream.map(stream.combine([body1I, body2I, headerI], function (i) {
				return i.minHeight;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args.reduce(add, 0);
			}), instance.minHeight);

			var fixedNow = false;

			return [{
				top: stream.once(0),
				left: stream.once(0),
				width: context.width,
				height: body1I.minHeight,
			}, {
				top: stream.combine([body1I.minHeight, headerI.minHeight], add),
				left: stream.once(0),
				width: context.width,
				height: body2I.minHeight,
			}, {
				top: stream.combine([body1I.minHeight, context.scroll, context.topAccum], function (mh, scroll, topAccum) {
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
				left: stream.once(0),
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
	config.maxPerRow = config.maxPerRow || 0;

	return padding(config.outerGutter ? config.gutterSize : 0, div.all([
		componentName('grid'),
		children(cs),
		wireChildren(function (instance, context, is) {
			if (is.length === 0) {
				stream.push(instance.minWidth, 0);
				stream.push(instance.minHeight, 0);
			}
			var minWidthsS = stream.combine(is.map(function (i) {
				return i.minWidth;
			}), function () {
				return Array.prototype.slice.call(arguments);
			});
			var minHeightsS = stream.combine(is.map(function (i) {
				return i.minHeight;
			}), function () {
				return Array.prototype.slice.call(arguments);
			});

			// todo: fix interaction of allSameWidth and useFullWidth
			stream.pushAll(stream.map(minWidthsS, function (mws) {
				return mws.reduce(function (a, mw) {
					return config.useFullWidth ? a + mw + config.gutterSize : Math.max(a, mw) + config.gutterSize;
				}, -config.gutterSize);
			}), instance.minWidth);

			var contexts = is.map(function (i) {
				return {
					top: stream.never(),
					left: stream.never(),
					width: stream.never(),
					height: stream.never(),
				};
			});

			var rowsStream = stream.combine([
				context.width,
				minWidthsS], function (gridWidth, mws) {
					if (config.allSameWidth) {
						var maxMW = mws.reduce(mathMax, 0);
						// thank you, keenan simons
						for (var ii = 0; ii < mws.length; ii++) {
							mws[ii] = maxMW;
						}
					}
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
						}, 0);
						var widthNeeded = Math.min(mw, gridWidth);

						if ((config.maxPerRow > 0 &&
							currentRow.cells.length === config.maxPerRow) ||
							(widthNeeded > 0 &&
							 widthNeeded + widthUsedThisRow > gridWidth)) {
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
							stream.push(ctx.width, position.width);
						});
					});

					return rows;
				});

			var rowsWithHeights = stream.combine([
				minHeightsS,
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

				stream.push(instance.minHeight, rows.map(function (r) {
					return r.height;
				}).reduce(function (a, b) { return a + b + config.gutterSize; }, -config.gutterSize));
				return rows;
			});


			stream.all([
				context.width,
				context.height,
				rowsWithHeights], function (gridWidth, gridHeight, rows) {
					if (config.bottomToTop) {
						rows = rows.slice(0).reverse();
					}
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
							stream.push(ctx.top, position.top);
							stream.push(ctx.left, position.left);
							stream.push(ctx.width, position.width);
							stream.push(ctx.height, position.height);
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

var withMinWidthStream = function (getMinWidthStream, c) {
	return div.all([
		componentName('with-min-width-stream'),
		child(c),
		wireChildren(function (instance, context, i) {
			if ($.isFunction(getMinWidthStream)) {
				stream.pushAll(getMinWidthStream(i, context), instance.minWidth);
			}
			else {
				stream.pushAll(getMinWidthStream, instance.minWidth);
			}
			stream.pushAll(i.minHeight, instance.minHeight);
			return [{
				top: stream.once(0),
				left: stream.once(0),
				width: context.width,
				height: context.height,
			}];
		}),
	]);
};
var withMinHeightStream = function (getMinHeightStream, c) {
	return div.all([
		componentName('with-min-height-stream'),
		child(c),
		wireChildren(function (instance, context, i) {
			if ($.isFunction(getMinHeightStream)) {
				stream.pushAll(getMinHeightStream(i, context), instance.minHeight);
			}
			else {
				stream.pushAll(getMinHeightStream, instance.minHeight);
			}
			stream.pushAll(i.minWidth, instance.minWidth);
			return [{
				top: stream.once(0),
				left: stream.once(0),
				width: context.width,
				height: context.height,
			}];
		}),
	]);
};
var minHeightAtLeast = function (number, c) {
	return withMinHeightStream(function (instance) {
		return stream.map(instance.minHeight, function (mh) {
			return Math.max(mh, number);
		});
	}, c);
};

var extendToWindowBottom = function (c, distanceStream) {
	distanceStream = distanceStream || stream.once(0);
	return withMinHeightStream(function (instance, context) {
		return stream.combine([instance.minHeight,
							   context.top,
							   context.topAccum,
							   distanceStream,
							   windowResize], function (mh, t, ta, distance) {
								   return Math.max(mh, window.innerHeight - t - ta - distance);
							   });
	}, c);
};

var atMostWindowBottom = function (c, distanceStream) {
	distanceStream = distanceStream || stream.once(0);
	return withMinHeightStream(function (instance, context) {
		return stream.combine([instance.minHeight,
							   context.top,
							   context.topAccum,
							   distanceStream,
							   windowResize], function (mh, t, ta, distance) {
								   return Math.min(mh, window.innerHeight - t - ta - distance);
							   });
	}, c);
};

var overlays = function (cs) {
	return div.all([
		children(cs),
		wireChildren(function (instance, context, is) {
			var chooseLargest = function (streams) {
				return stream.combine(streams, function () {
					var args = Array.prototype.slice.call(arguments);
					return args.reduce(mathMax, 0);
				});
			};

			stream.pushAll(chooseLargest(is.map(function (i) {
				return i.minHeight;
			})), instance.minHeight);
			stream.pushAll(chooseLargest(is.map(function (i) {
				return i.minWidth;
			})), instance.minWidth);
			return [
				is.map(function (i) {
					return {
						top: stream.once(0),
						left: stream.once(0),
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
			stream.pushAll(cI.minWidth, instance.minWidth);
			stream.pushAll(cI.minHeight, instance.minHeight);

			var ctx = {
				top: stream.once(0),
				left: stream.once(0),
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
	var imgAspectRatio = stream.once(config.aspectRatio || 1);
	if (!config.src.map) {
		config.src = stream.once(config.src);
	}
	return div.all([
		componentName('with-background-image'),
		$css('overflow', 'hidden'),
		child(img.all([
			$css('visibility', 'hidden'),
			function (i, context) {
				stream.push(i.minWidth, 0);
				stream.push(i.minHeight, 0);
				stream.map(config.src, function (src) {
					i.$el.prop('src', src);
				});

				i.$el.on('load', function () {
					var nativeWidth = findMinWidth(i.$el);
					var nativeHeight = findMinHeight(i.$el);
					var aspectRatio = nativeWidth / nativeHeight;
					stream.push(imgAspectRatio, aspectRatio);
				});
				stream.all([context.width, context.height], function () {
					i.$el.css('visibility', '');
				});
			},
		])),
		child(c),
		wireChildren(function (instance, context, imgI, cI) {
			stream.pushAll(cI.minWidth, instance.minWidth);
			stream.pushAll(cI.minHeight, instance.minHeight);

			var ctx = instance.newCtx();
			stream.push(context.top, 0);
			stream.push(context.left, 0);
			stream.pushAll(context.width, ctx.width);
			stream.pushAll(context.height, ctx.height);

			var imgCtx = instance.newCtx();
			stream.push(imgCtx.top, 0);
			stream.push(imgCtx.left, 0);
			stream.all([imgAspectRatio, context.width, context.height], function (aspectRatio, ctxWidth, ctxHeight) {
				var ctxAspectRatio = ctxWidth / ctxHeight;
				if (aspectRatio < ctxAspectRatio) {
					stream.push(imgCtx.width, ctxWidth);
					stream.push(imgCtx.height, ctxWidth / aspectRatio);
				}
				else {
					stream.push(imgCtx.width, ctxHeight * aspectRatio);
					stream.push(imgCtx.height, ctxHeight);
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
	return div.all(stream.map(css, function (cs) {
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
			var maxMWs = stream.combine(iss.reduce(function (a, is) {
				stream.push(a, stream.combine(is.map(function (i) {
					return i.minWidth;
				}), function () {
					return Array.prototype.slice.call(arguments);
				}));
				return a;
			}, []), function () {
				var rowMWs = Array.prototype.slice.call(arguments);
				return rowMWs.reduce(function (a, rowMWs) {
					return stream.map(rowMWs, function (mw, i) {
						return Math.max(a[i] || 0, mw);
					});
				}, []);
			});
			stream.map(maxMWs, function (maxMWs) {
				var mw = maxMWs.reduce(function (a, mw) {
					return a + mw + gutterSize;
				}, -gutterSize);
				stream.push(instance.minWidth, mw);
			});

			// set table min height
			var rowMinHeights = iss.reduce(function (a, is) {
				stream.push(a, stream.combine(is.map(function (i) {
					return i.minHeight;
				}), function () {
					var args = Array.prototype.slice.call(arguments);
					return args.reduce(mathMax, 0);
				}));
				return a;
			}, []);
			stream.combine(rowMinHeights, function () {
				var mhs = Array.prototype.slice.call(arguments);
				var mh = mhs.reduce(function (a, mh) {
					return a + mh + gutterSize;
				}, -gutterSize);
				stream.push(instance.minHeight, mh);
			});

			return stream.map(rowMinHeights, function (mh, i) {
				return stream.map(iss[i], function (_, index) {
					return {
						width: stream.map(maxMWs, function (maxMWs) {
							return maxMWs[index];
						}),
						height: rowMinHeights[i],
						top: stream.combine(rowMinHeights.slice(0, i).concat([stream.once(0)]), function () {
							var mhs = Array.prototype.slice.call(arguments);
							return mhs.reduce(function (a, mh) {
								return a + mh + gutterSize;
							}, -gutterSize);
						}),
						left: stream.map(maxMWs, function (maxMWs) {
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
	var whichTab = stream || stream.once(0);
	return stack({}, [
		sideBySide({
			handleSurplusWidth: centerSurplusWidth,
		}, stream.map(list, function (item, index) {
			return alignTBM({
				bottom: toggleComponent([
					item.tab.left,
					item.tab.right,
					item.tab.selected,
				], stream.map(whichTab, function (i) {
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
						stream.push(whichTab, index);
					}),
				]),
			});
		})),
		componentStream(stream.map(whichTab, function (i) {
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

var ignoreHashChange = false;
var route = function (s, router) {
	var i;
	return div.all([
		child(div.all([
			componentName('route'),
			function (instance, context) {
				stream.onValue(s, function (hash) {
					if (ignoreHashChange) {
						ignoreHashChange = false;
						return;
					}
					if (i) {
						i.destroy();
					}

					Q.all([router(hash)]).then(function (cs) {
						var c = cs[0];
						i = c.create(context);
						i.$el.css('transition', 'inherit');
						stream.pushAll(i.minWidth, instance.minWidth);
						stream.pushAll(i.minHeight, instance.minHeight);
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

