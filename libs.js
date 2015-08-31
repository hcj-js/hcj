var passThroughToFirst = function (instance, context, i) {
	i.minHeight.pushAll(instance.minHeight);
	i.minWidth.pushAll(instance.minWidth);
	return [{
		width: context.width,
		height: context.height,
	}];
};

var Unit = func(Number, String);
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
var transparent = color({
	a: 0,
})
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
			i.updateDimensions(true);
		};
	};
};

var $addClass = $$('addClass');
var $css = $$('css');
var $attr = $$('attr');
var $prop = $$('prop');

var chooseWidthFromHeight = function (instance, context) {
	context.width.onValue(function (w) {
		var optimalHeight = findOptimalHeight(instance.$el, w);
		instance.minHeight.push(optimalHeight);
	});
};
var $html = function (html, setWidth) {
	return function (instance, context) {
		instance.$el.html(html);
		chooseWidthFromHeight(instance, context);
		if (setWidth) {
			instance.updateDimensions();
		}
	};
};


var windowWidth = Stream.never();
var updateWindowWidth = function () {
	windowWidth.push(document.body.clientWidth);
}
$(updateWindowWidth);
$(window).on('resize', function () {
	updateWindowWidth();
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
			i.$el.on(event, handler);
		};
	};
};
var changeThis = onThis('change');
var clickThis = onThis('click');
var inputPropertychangeThis = onThis('input propertychange');
var keydownThis = onThis('keydown');
var keyupThis = onThis('keyup');
var mouseoverThis = onThis('mouseover');
var mouseoutThis = onThis('mouseout');
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
		wireChildren(function (instance, context, i) {
			i.minHeight.pushAll(instance.minHeight);
			i.minWidth.pushAll(instance.minWidth);
			return [{
				width: context.width,
				height: context.height,
			}];
		}),
	]);
};

var nothing = div.all([
	componentName('nothing'),
	withMinHeight(0, true),
	withMinWidth(0, true),
]);

var text = function (text) {
	return div.all([
		componentName('text'),
		$html(text, true),
	]);
};
var faIcon = function (str) {
	return text('<i class="fa fa-' + str + '"></i>');
};
var paragraph = function (text, minWidth) {
	return div.all([
		componentName('paragraph'),
		$html(text),
		withMinWidth(minWidth || 0, true),
	]);
};

var htmlStream = function (htmlStream) {
	return function (instance, context) {
		htmlStream.map(function (html) {
			instance.$el.html(html);
			instance.$el.find('div').css('position', 'initial');
			instance.updateDimensions();
		});
	};
};


var sideBySide = function (config, cs) {
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
				}, 0));
			});
			
			var contexts = is.map(function () {
				return {
					left: Stream.never(),
					width: Stream.never(),
					height: context.height,
				};
			});

			Stream.all([context.width, allMinWidths], function (width, mws) {
				var left = 0;
				var positions = mws.map(function (mw) {
					var position = {
						left: left,
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

			is.map(function (i) {
				i.minHeight;
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

var stack = function (cs, options) {
	return div.all([
		componentName('stack'),
		children(Q.all(cs).then(function (cs) {
			return cs.map(function (c) {
				return c.and($css('transition', 'inherit'));
			});
		})),
		wireChildren(function (instance, context, is) {
			var separatorSize = (options && options.separatorSize) || 0;
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
						}, 'stack option min height');
					}
					else {
						return i.minHeight;
					}
					return i.minHeight;
				}), function () {
					var args = Array.prototype.slice.call(arguments);
					var mh = args.reduce(function (a, b) {
						return a + b + separatorSize;
					}, -separatorSize);
					return mh;
				});
			};

			var contexts = [];
			is.reduce(function (is, i) {
				var tops = totalMinHeightStream(is);
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
					top: tops,
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
	var top = 0, bottom = 0, left = 0, right = 0;
	
	// amount may be a single number
	if ($.isNumeric(amount)) {
		top = bottom = left = right = amount;
	}
	// or an object with properties containing 'top', 'bottom', 'left', and 'right'
	else {
		for (var key in amount) {
			lcKey = key.toLowerCase();
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
			i.$el.css('transition', 'inherit');
			
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
				left: Stream.combine([context.width, mWidth], function (width, mw) {
					return (width - mw) / 2;
				}),
				width: mWidth,
				height: context.height,
			}, {
				width: lWidth,
				height: context.height,
			}, {
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
		child(tbm.middle.and($css('transition', 'inherit'))),
		child(tbm.bottom.and($css('transition', 'inherit'))),
		child(tbm.top.and($css('transition', 'inherit'))),
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
				width: context.width,
				height: mI.minHeight,
			}, {
				top: Stream.combine([context.height, tI.minHeight], function (height, mh) {
					return height - mh;
				}, 'alignTBM bottom.top'),
				width: context.width,
				height: bI.minHeight,
			}, {
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
			wireChildren(function (instance, context, i) {
				i.minHeight.pushAll(instance.minHeight);
				i.minWidth.pushAll(instance.minWidth);
				return [{
					width: context.width,
					height: context.height,
				}];
			}),
		])),
		wireChildren(function (instance, context, i) {
			i.minWidth.map(function (mw) {
				return mw + left + right;
			}).pushAll(instance.minWidth);
			
			i.minHeight.map(function (mh) {
				return mh + top + bottom;
			}).pushAll(instance.minHeight);
			
			return [{
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

var toggleComponent = function (cs, indexStream) {
	return div.all([
		componentName('toggle-component'),
		children(cs),
		wireChildren(function (instance, context, is) {
			var combineStreams = function (streams) {
				return Stream.combine([indexStream, Stream.combine(streams, function () {
					return Array.prototype.slice.call(arguments);
				})], function (index, values) {
					return values[index];
				});
			};

			indexStream.onValue(function (index) {
				is.map(function (i) {
					i.$el.css('display', 'none');
				});
				is[index].$el.css('display', '');
			});
			
			combineStreams(is.map(function (i) {
				return i.minWidth;
			})).pushAll(instance.minWidth);
			combineStreams(is.map(function (i) {
				return i.minHeight;
			})).pushAll(instance.minHeight);

			return [cs.map(function () {
				return {
					width: context.width,
					height: context.height,
				};
			})];
		}),
	]);
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
			}, {
				width: context.width,
				height: context.height,
			}];
		}),
	]);
}

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
				width: ctx.width,
				height: bodyI.minHeight,
				top: headerI.minHeight,
			}, {
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
				width: context.width,
			}, {
				width: context.width,
				top: Stream.combine([body1I.minHeight, headerI.minHeight], function (a, b) {
					return a + b;
				}),
			}, {
				width: context.width,
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
			}];
		}),
	]);
};


var GridConfig = object({
	gutterSize: number,
	outerGutter: bool,
	minColumnWidth: number,
	handleSurplusWidth: func(),
	handleSurplusHeight: func(),
});

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


var grid = function (config, cs) {
	config.gutterSize = config.gutterSize || 0;
	config.minColumnWidth = config.minColumnWidth || 100;
	config.handleSurplusWidth = config.handleSurplusWidth || ignoreSurplusWidth;
	config.handleSurplusHeight = config.handleSurplusHeight || ignoreSurplusHeight;
	
	return padding(config.outerGutter ? config.gutterSize : 0, div.all([
		componentName('grid'),
		children(cs.map(function (c) {
			return c.all([
				$css('transition', 'top 0.5s, left 0.5s, width 0.5s'),
			]);
		})),
		wireChildren(function (instance, context, is) {
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
					var cellsPerRow = Math.floor(gridWidth / config.minColumnWidth / 2) * 2;
					var cellWidth = (gridWidth - config.gutterSize * (cellsPerRow - 1)) / cellsPerRow;

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

						var gridCellsUsed = currentRow.cells.reduce(function (a, b) {
							return a + b;
						}, 0);
						var gridCellsNeeded = Math.min(
							1 + Math.ceil((mw - cellWidth) / (cellWidth + config.gutterSize)),
							cellsPerRow);
						
						if (gridCellsUsed > 0 &&
							gridCellsUsed + gridCellsNeeded > cellsPerRow) {
							rows.push(currentRow);
							currentRow = blankRow();
						}

						currentRow.cells.push(gridCellsNeeded);
						currentRow.contexts.push(contexts[index]);
						
						return {
							rows: rows,
							currentRow: currentRow,
						};
					}, {
						rows: [],
						currentRow: blankRow(),
					});
					rows = rowsAndCurrentRow.rows;
					rows.push(rowsAndCurrentRow.currentRow);

					rows.map(function (row, i) {
						var cellsUsed = 0;
						var positions = row.cells.map(function (cells) {
							var cellGutterWidth = cellWidth + config.gutterSize;
							var position = {
								top: top,
								left: cellGutterWidth * (cellsUsed),
								width: cellWidth + cellGutterWidth * (cells - 1),
							};
							cellsUsed += cells;
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
					var cellsPerRow = Math.floor(gridWidth / config.minColumnWidth / 2) * 2;
					var cellWidth = (gridWidth - config.gutterSize * (cellsPerRow - 1)) / cellsPerRow;

					var top = 0;
					rows = config.handleSurplusHeight(gridHeight, rows, config);
					rows.map(function (row, i) {
						var cellsUsed = 0;
						var positions = row.cells.map(function (cells) {
							var cellGutterWidth = cellWidth + config.gutterSize;
							var position = {
								top: top,
								left: cellGutterWidth * (cellsUsed),
								width: cellWidth + cellGutterWidth * (cells - 1),
								height: row.height,
							};
							cellsUsed += cells;
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

var BackgroundImageConfig = object({
	src: string,
	position: string,
});

var withMinHeightStream = function (getMinHeightStream, c) {
	return div.all([
		componentName('with-min-height-stream'),
		child(c),
		wireChildren(function (instance, context, i) {
			getMinHeightStream(i, context).pushAll(instance.minHeight);
			i.minWidth.pushAll(instance.minWidth);
			return [{
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

var withBackground = function (background, c) {
	return div.all([
		componentName('with-background'),
		child(background),
		child(c),
		wireChildren(function (instance, context, bI, cI) {
			cI.minWidth.pushAll(instance.minWidth);
			cI.minHeight.pushAll(instance.minHeight);

			var ctx = {
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
			$css('transition', 'inherit'),
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
		child(c.and($css('transition', 'inherit'))),
		wireChildren(function (instance, context, imgI, cI) {
			cI.minWidth.pushAll(instance.minWidth);
			cI.minHeight.pushAll(instance.minHeight);
			
			var ctx = instance.newCtx();
			context.width.pushAll(ctx.width);
			context.height.pushAll(ctx.height);
			
			var imgCtx = instance.newCtx();
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


var useComponentStream = function (cStream) {
	var i;
	return div.all([
		componentName('use-component-stream'),
		function (instance, context) {
			cStream.map(function (c) {
				Q.all([c]).then(function (cs) {
					if (i) {
						i.destroy();
					}

					var c = cs[0];

					ctx.top.push(0);
					ctx.left.push(0);
					context.width.pushAll(ctx.width);
					context.height.pushAll(ctx.height);
					i = c.create(ctx);
					i.minWidth.pushAll(instance.minWidth);
					i.minHeight.pushAll(instance.minHeight);
				});
			});
		},
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
		return f(str);
	};
};

var route = function (router) {
	var i;
	return div.all([
		componentName('route'),
		function (instance, context) {
			windowHash.onValue(function (hash) {
				hash = hash.substring(1);
				
				if (i) {
					i.destroy();
				}

				Q.all([router(hash)]).then(function (cs) {
					var c = cs[0];
					i = c.create(context);
					i.$el.css('transition', 'inherit');
					i.minWidth.pushAll(instance.minWidth);
					i.minHeight.pushAll(instance.minHeight);
				});
			});
		},
		function (i) {
			i.minHeight;
		},
	]);
};
