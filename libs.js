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
		var args = Array.prototype.slice.call(arguments);
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
	function (string) {
		return function (i) {
			i.$el.html(string);
			var mw = findMinWidth(i.$el);
			var mh = findMinHeight(i.$el)
			i.minWidth.push(mw);
			i.minHeight.push(mh);
		};
	});


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

var appendToI = function (c) {
	return function (i, ctx) {
		var destroy = i.destroy;
		c.create(ctx);
	};
};

var componentName = function (name) {
	return function (i) {
		i.$el.addClass(name);
	};
};

var stack = type(
	func([list(Component)], Component),
	function (cs) {
		var conc = div.all([
			componentName('stack'),
			children(cs),
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
					contexts.push({
						top: totalMinHeightStream(is),
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
		
		return conc;
	});

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

var lrmHeader = function (lrm) {
	var lHeight = Stream.never();
	var rHeight = Stream.never();
	var mHeight = Stream.never();
	
	return div.all([
		componentName('lrmHeader'),
		child(lrm.middle || div),
		child(lrm.left || div),
		child(lrm.right || div),
		wireChildren(function (instance, context, mI, lI, rI) {
			var minHeight = Stream.combine([mI, lI, rI].map(function (i) {
				return i.minHeight;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				var height = args.reduce(function (h, mh) {
					return Math.max(h, mh);
				}, 0);
				return height;
			});

			minHeight.pushAll(instance.minHeight);

			return [{
				left: Stream.combine([context.width, mI.minWidth], function (width, mw) {
					return (width - mw) / 2;
				}),
				width: mI.minWidth,
			}, {
				width: lI.minWidth,
			}, {
				left: Stream.combine([context.width, rI.minWidth], function (width, rMW) {
					return width - rMW;
				}),
				width: rI.minWidth,
			}];
		}),
	]);
};

var border = function (color, amount, c) {
	return padding(amount, c).all([
		$css('background-color', color),
	]);
};
var withMinWidth = function (mw) {
	return function (i) {
		i.minWidth.push(mw);
	};
};
var withMinHeight = function (mh) {
	return function (i) {
		i.minHeight.push(mh);
	};
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
});


var grid = type(
	func(GridConfig, list(Component)),
	function (config, cs) {
		return padding(config.outerGutter ? config.gutterSize : 0, div.all([
			children(cs.map(function (c) {
				return c.all([
					$css('transition', 'top 0.5s, left 0.5s, width 0.5s'),
				]);
			})),
			wireChildren(function (instance, context, is) {
				var gridCellCount = context.width.map(function (width) {
					return Math.floor(width / config.minColumnWidth);
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
					// var cellWidth = width / cellCount;
					
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
							
							colsTaken += item.cols;
						});
						
						currentTop += maxHeight + config.gutterSize;
						colsUsed = 0;
						maxHeight = 0;
						thisRow = [];
					};
					var pushOntoRow = function (item) {
						if (colsUsed + item.cols > cellCount) {
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
	});
