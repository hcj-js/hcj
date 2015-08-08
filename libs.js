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



// $$ :: String -> [*] -> Component -> Component
// applies a jquery function to the component instance after creation
var $$ = function (func) {
	return function () {
		var args = Array.prototype.slice.call(arguments);
		return function (i) {
			i.$el[func].apply(i.$el, args);
			var mw = findMinWidth(i.$el);
			var mh = findMinHeight(i.$el);
			i.minWidth.push(mw);
			i.minHeight.push(mh);
		};
	};
};

var $addClass = $$('addClass');
var $css = $$('css');
var $attr = $$('attr');
var $prop = $$('prop');
var $html = $$('html');


var windowWidth = Stream.never();
var updateWindowWidth = function () {
	windowWidth.push($('body').width());
}
$(updateWindowWidth);
$(window).on('resize', function () {
	updateWindowWidth();
});

var windowScroll = Stream.never();
$(window).on('scroll', function () {
	windowScroll.push(window.scrollY);
});
windowScroll.push(window.scrollY);

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
		context.backgroundColor.push(bc);
	};
};
var withFontColor = function (fc) {
	return function (i, context) {
		context.fontColor.push(fc);
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
var mouseoverThis = onThis('mouseover');
var mouseoutThis = onThis('mouseout');


var image = function (config) {
	return img.all([
		$prop('src', config.src),
		function (i, context) {
			i.$el.on('load', function () {
				var nativeWidth = findMinWidth(i.$el);
				var nativeHeight = findMinHeight(i.$el);
				var aspectRatio = nativeWidth / nativeHeight;
				
				var minWidth, minHeight;
				if (config.minWidth) {
					minWidth = config.minWidth;
					minHeight = minWidth / aspectRatio;
				}
				else if (config.minHeight) {
					minHeight = config.minHeight;
					minWidth = minHeight * aspectRatio;
				}
				i.minWidth.push(minWidth);
				i.minHeight.push(minHeight);
			});
		},
	]);
};


var sideBySide = function (cs) {
	return div.all([
		componentName('sideBySide'),
		children(cs),
		wireChildren(function (instance, context, is) {
			var totalMinWidthStream = function (is) {
				return Stream.combine(is.map(function (i) {
					return i.minWidth;
				}), function () {
					var args = Array.prototype.slice.call(arguments);
					return args.reduce(function (a, b) {
						return a + b;
					}, 0);
				});
			};

			var contexts = [];
			is.reduce(function (is, i) {
				contexts.push({
					left: totalMinWidthStream(is),
					width: i.minWidth,
					height: context.height,
				});
				
				is.push(i);
				return is;
			}, []);

			totalMinWidthStream(is).pushAll(instance.minWidth);
			
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

var stack = function (cs) {
	return div.all([
		componentName('stack'),
		children(cs.map(function (c) {
			return c.and($css('transition', 'inherit'));
		})),
		wireChildren(function (instance, context, is) {
			var totalMinHeightStream = function (is) {
				return Stream.combine(is.map(function (i) {
					return i.minHeight;
				}), function () {
					var args = Array.prototype.slice.call(arguments);
					return args.reduce(function (a, b) {
						return a + b;
					}, 0);
				});
			};

			var contexts = [];
			is.reduce(function (is, i) {
				var tops = totalMinHeightStream(is);
				contexts.push({
					top: tops,
					width: context.width,
					height: i.minHeight,
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
		child(c.and($css('transition', 'inherit'))),
		wireChildren(function (instance, context, i) {
			i.minWidth.map(function (mw) {
				return mw + left + right;
			}).pushAll(instance.minWidth);
			
			i.minHeight.map(function (mh) {
				return mh + top + bottom;
			}).pushAll(instance.minHeight);
			
			return [{
				top: Stream.once(top),
				left: Stream.once(left),
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

var alignLRM = function (lrm) {
	var lHeight = Stream.never();
	var rHeight = Stream.never();
	var mHeight = Stream.never();
	
	return div.all([
		componentName('alignLRM'),
		child(lrm.middle || div),
		child(lrm.left || div),
		child(lrm.right || div),
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

			return [{
				left: Stream.combine([context.width, mI.minWidth], function (width, mw) {
					return (width - mw) / 2;
				}),
				width: mI.minWidth,
				height: headerHeight,
			}, {
				width: lI.minWidth,
				height: headerHeight,
			}, {
				left: Stream.combine([context.width, rI.minWidth], function (width, rMW) {
					return width - rMW;
				}),
				width: rI.minWidth,
				height: headerHeight,
			}];
		}),
	]);
};

var alignTBM = function (tbm) {
	var tWidth = Stream.never();
	var bWidth = Stream.never();
	var mWidth = Stream.never();

	tbm.middle = tbm.middle || div;
	tbm.bottom = tbm.bottom || div;
	tbm.top = tbm.top || div;
	
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
				var height = args.reduce(function (h, mh) {
					return Math.max(h, mh);
				}, 0);
				return height;
			});
			minWidth.pushAll(instance.minWidth);
			
			Stream.combine([mI, bI, tI].map(function (i) {
				return i.minHeight;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				var height = args.reduce(function (h, mh) {
					return h + mh;
				}, 0);
				return height;
			}).pushAll(instance.minHeight);

			return [{
				top: Stream.combine([context.height, mI.minHeight], function (height, mh) {
					return (height - mh) / 2;
				}),
				width: context.width,
				height: mI.minHeight,
			}, {
				top: Stream.combine([context.height, tI.minHeight], function (height, mh) {
					return height - mh;
				}),
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
	var invert = Stream.once(false);
	
	var choose = function (stream1, stream2) {
		return Stream.combine([invert, stream1, stream2], function (i, v1, v2) {
			return i ? v2 : v1;
		});
	}
	
	
	return div.all([
		child(c.and($css('transition', 'background-color 0.2s linear, color 0.2s linear'))),
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
	return padding(amount, c).all([
		$css('background-color', color),
	]);
};
var fixedHeaderBody = function (header, body) {
	return div.all([
		componentName('fixedHeaderBody'),
		child(body),
		child(header.all([
			$css('position', 'fixed'),
		])),
		wireChildren(function (instance, ctx, bodyI, headerI) {
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
				top: headerI.minHeight,
			}, {
				width: ctx.width,
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
			
			return [{
				width: context.width,
			}, {
				width: context.width,
				top: Stream.combine([body1I.minHeight, headerI.minHeight], function (a, b) {
					return a + b;
				}),
			}, {
				width: context.width,
				top: Stream.combine([body1I.minHeight, context.scroll], function (mh, scroll) {
					return Math.max(mh, scroll);
				}),
			}];
		}),
	]);
};


var GridConfig = object({
	gutterSize: number,
	outerGutter: bool,
	minColumnWidth: number,
	splitSurplus: bool,
});


var grid = function (config, cs) {
	config.gutterSize = config.gutterSize || 0;
	config.minColumnWidth = config.minColumnWidth || 100;
	return padding(config.outerGutter ? config.gutterSize : 0, div.all([
		children(cs.map(function (c) {
			return c.all([
				$css('transition', 'top 0.5s, left 0.5s, width 0.5s'),
			]);
		})),
		wireChildren(function (instance, context, is) {
			var gridCellCount = context.width.map(function (width) {
				return Math.floor(width / config.minColumnWidth / 2) * 2;
			});

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

			var contexts = [];
			for (var i = 0; i < is.length; i++) {
				contexts[i] = {
					top: Stream.never(),
					left: Stream.never(),
					width: Stream.never(),
					height: Stream.never(),
				};
			}

			Stream.combine([gridCellCount, context.width, minWidths, minHeights], function (cellCount, width, mws, mhs) {
				var cellWidth = (width - config.gutterSize * (cellCount - 1)) / cellCount;
				
				var currentTop = 0;
				var colsUsed = 0;
				var maxHeight = 0;
				var thisRow = [];
				
				var nextRow = function (lastRow) {
					var colsTaken = 0;
					var surplusCols = cellCount - colsUsed;
					var thisRowCellWidth = cellWidth;
					var extraLeft = 0;

					if (lastRow) {
						var surplusWidth = surplusCols * (cellWidth + config.gutterSize);
						extraLeft = surplusWidth / 2;
					}
					else if (config.splitSurplus) {
						thisRowCellWidth = (width - config.gutterSize * (colsUsed - 1)) / colsUsed;
					}
					else {
						thisRow[0].cols += surplusCols;
					}
					
					thisRow.map(function (item) {
						item.context.top.push(currentTop);
						item.context.left.push(extraLeft + colsTaken * (thisRowCellWidth + config.gutterSize));
						item.context.width.push(thisRowCellWidth * item.cols + config.gutterSize * (item.cols - 1));
						item.context.height.push(maxHeight);
						
						colsTaken += item.cols;
					});
					
					currentTop += maxHeight + config.gutterSize;
					colsUsed = 0;
					maxHeight = 0;
					thisRow = [];
				};
				var pushOntoRow = function (item) {
					if (colsUsed + item.cols > cellCount && colsUsed > 0) {
						nextRow();
					}

					colsUsed += item.cols;
					maxHeight = Math.max(maxHeight, item.mh);
					thisRow.push(item);
				};

				for (var j = 0; j < is.length; j++) {
					var i = is[j];
					var mw = mws[j];
					var mh = mhs[j];
					var colsTaken = 1;
					var widthAvailable = cellWidth;
					while (widthAvailable < mw) {
						colsTaken += 1;
						widthAvailable += cellWidth + config.gutterSize;
					}
					pushOntoRow({
						cols: colsTaken,
						context: contexts[j],
						mh: mh,
					});
				}
				
				nextRow(true);
				instance.minHeight.push(currentTop);
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

var withBackgroundImage = function (config, c) {
	return div.all([
		child(img.all([
			$prop('src', config.src),
			$css('transition', 'inherit'),
			function (i, context) {
				i.$el.on('load', function () {
					var nativeWidth = findMinWidth(i.$el);
					var nativeHeight = findMinHeight(i.$el);
					var aspectRatio = nativeWidth / nativeHeight;
					
					var minWidth, minHeight;

					Stream.combine([context.width, context.height], function (ctxWidth, ctxHeight) {
						var ctxAspectRatio = ctxWidth / ctxHeight;
						if (aspectRatio < ctxAspectRatio) {
							context.width.push(ctxWidth);
							context.height.push(ctxWidth / aspectRatio);
						}
						else {
							context.width.push(ctxHeight * aspectRatio);
							context.height.push(ctxHeight);
						}
					});
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
			return [
				ctx,
				ctx,
			];
		}),
	]);
};

