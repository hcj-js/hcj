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
var changeThis = onThis('change');
var clickThis = onThis('click');
var keydownThis = onThis('keydown');
var keyupThis = onThis('keyup');
var mouseoverThis = onThis('mouseover');
var mouseoutThis = onThis('mouseout');
var submitThis = onThis('click');


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

			var allMinWidths = is.map(function (i) {
				return i.minWidth;
			});
			
			var totalMinWidthStream = function (is) {
				return Stream.combine(is.map(function (i) {
					return i.minWidth;
				}), function () {
					var args = Array.prototype.slice.call(arguments);
					return args.reduce(function (a, b) {
						return a + b;
					}, 0);
				}, 'side by side total min width');
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
			}, 'side by side min height').pushAll(instance.minHeight);
			
			return [contexts];
		}),
	]);
};

var stack = function (cs, options) {
	return div.all([
		componentName('stack'),
		children(cs.map(function (c) {
			return c.and($css('transition', 'inherit'));
		})),
		wireChildren(function (instance, context, is) {
			var totalMinHeightStream = function (is) {
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
					return args.reduce(function (a, b) {
						return a + b;
					}, 0);
				}, 'stack total min height');
			};

			var contexts = [];
			is.reduce(function (is, i) {
				var tops = totalMinHeightStream(is);
				var iMinHeight;
				
				if (options && options.mhs && options.mhs[is.length]) {
					var optionMinHeight = options.mhs[is.length](context);
					iMinHeight = Stream.combine([i.minHeight, optionMinHeight], function (a, b) {
						return Math.max(a, b);
					}, 'stack option min height');
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
			}, 'stack min width').pushAll(instance.minWidth);
			
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
	var lHeight = Stream.never('alignLRM left height');
	var rHeight = Stream.never('alignLRM right height');
	var mHeight = Stream.never('alignLRM middle height');
	
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
			}, 'alignLRM height');
			headerHeight.pushAll(instance.minHeight);
			
			Stream.combine([mI, lI, rI].map(function (i) {
				return i.minWidth;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				var height = args.reduce(function (w, mw) {
					return w + mw;
				}, 0);
				return height;
			}, 'alignLRM width').pushAll(instance.minWidth);

			var minAvailableRequested = function (available, requested) {
				return Stream.combine([available, requested], function (a, r) {
					return Math.min(a, r);
				}, 'minAvailableRequested');
			};
			var mWidth = minAvailableRequested(context.width, mI.minWidth);
			var lWidth = minAvailableRequested(context.width, lI.minWidth);
			var rWidth = minAvailableRequested(context.width, rI.minWidth);

			return [{
				left: Stream.combine([context.width, mWidth], function (width, mw) {
					return (width - mw) / 2;
				}, 'alignLRM middle.left'),
				width: mWidth,
				height: headerHeight,
			}, {
				width: lWidth,
				height: headerHeight,
			}, {
				left: Stream.combine([context.width, rWidth], function (width, rMW) {
					return width - rMW;
				}, 'alignLRM right.left'),
				width: rWidth,
				height: headerHeight,
			}];
		}),
	]);
};

var alignTBM = function (tbm) {
	var tWidth = Stream.never('alignTBM top');
	var bWidth = Stream.never('alignTBM bottom');
	var mWidth = Stream.never('alignTBM middle');

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
	return padding(amount, c).all([
		$css('background-color', color),
	]);
};
var fixedHeaderBody = function (header, body) {
	return div.all([
		componentName('fixedHeaderBody'),
		child(body),
		child(header),
		wireChildren(function (instance, ctx, bodyI, headerI) {
			headerI.$el.css('position', 'fixed');
			
			Stream.combine([bodyI, headerI].map(function (i) {
				return i.minHeight;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args.reduce(function (a, i) {
					return a + i;
				}, 0);
			}, 'fixed header min height').pushAll(instance.minHeight);
			
			Stream.combine([bodyI, headerI].map(function (i) {
				return i.minWidth;
			}), function () {
				var args = Array.prototype.slice.call(arguments);
				return args.reduce(function (a, i) {
					return Math.max(a, i);
				}, 0);
			}, 'fixed header min width').pushAll(instance.minWidth);
			
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
	handleSurplusWidth: func(),
	handleSurplusHeight: func(),
});

var ignoreSurplusWidth = function (_, cols) {
	return cols;
};
var ignoreSurplusHeight = function (_, rows) {
	return rows;
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
			}, 'grid component min widths');
			var minHeights = Stream.combine(is.map(function (i) {
				return i.minHeight;
			}), function () {
				return Array.prototype.slice.call(arguments);
			}, 'grid component min heights');

			var contexts = is.map(function (i) {
				return {
					top: Stream.never('grid child top'),
					left: Stream.never('grid child left'),
					width: Stream.never('grid child width'),
					height: Stream.never('grid child height'),
				};
			});
			
			Stream.combine([
				context.width,
				context.height,
				minWidths,
				minHeights], function (gridWidth, gridHeight, mws, mhs) {
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
						var mh = mhs[index];

						var gridCellsUsed = currentRow.cells.reduce(function (a, b) {
							return a + b;
						}, 0);
						var gridCellsNeeded = 1 + Math.ceil((mw - cellWidth) / (cellWidth + config.gutterSize));
						
						if (gridCellsUsed > 0 &&
							gridCellsUsed + gridCellsNeeded > cellsPerRow) {
							rows.push(currentRow);
							currentRow = blankRow();
						}

						currentRow.cells.push(gridCellsNeeded);
						currentRow.contexts.push(contexts[index]);
						currentRow.height = Math.max(currentRow.height, mh);
						
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

					instance.minHeight.push(rows.map(function (r) {
						return r.height;
					}).reduce(function (a, b) { return a + b + config.gutterSize; }, -config.gutterSize));
					rows = config.handleSurplusHeight(gridHeight, rows);

					var top = 0;
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
						positions = config.handleSurplusWidth(gridWidth, positions, i);
						positions.map(function (position, index) {
							var ctx = row.contexts[index];
							ctx.top.push(position.top);
							ctx.left.push(position.left);
							ctx.width.push(position.width);
							ctx.height.push(position.height);
						});
						top += row.height + config.gutterSize;
					});
				}, 'grid super stream');

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

var extendToWindowBottom = function (c, distance) {
	distance = distance || 0;
	return withMinHeightStream(function (instance, context) {
		return Stream.combine([instance.minHeight, context.topAccum, windowResize], function (mh, ta) {
			return Math.max(mh, window.innerHeight - ta - distance);
		});
	}, c);
};

var withBackgroundImage = function (config, c) {
	var imgAspectRatio = Stream.never();
	return div.all([
		child(img.all([
			$prop('src', config.src),
			$css('transition', 'inherit'),
			$css('visibility', 'hidden'),
			function (i, context) {
				i.$el.on('load', function () {
					var nativeWidth = findMinWidth(i.$el);
					var nativeHeight = findMinHeight(i.$el);
					var aspectRatio = nativeWidth / nativeHeight;
					imgAspectRatio.push(aspectRatio);
				});
				Stream.combine([context.width, context.height], function () {
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
			Stream.combine([imgAspectRatio, context.width, context.height], function (aspectRatio, ctxWidth, ctxHeight) {
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
	return div.and(function (instance, context) {
		windowHash.map(function (hash) {
			hash = hash.substring(1);
			
			if (i) {
				i.destroy();
			}

			Q.all([router(hash)]).then(function (cs) {
				var c = cs[0];
				var ctx = instance.newCtx();
				context.width.pushAll(ctx.width);
				context.height.pushAll(ctx.height);
				i = c.create(ctx);
				i.minWidth.pushAll(instance.minWidth);
				i.minHeight.pushAll(instance.minHeight);
			});
		});
	});
};
