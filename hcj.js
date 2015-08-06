var JQuery = instance($, 'JQuery');

var Point2D = object({
	x: number,
	y: number,
});

var Context = object({
	$el: JQuery,               // contanier
	scroll: stream(number),    // window top, relative to origin
	top: stream(number),       // top coordinate, relative to origin (parent)
	left: stream(number),      // left coordinate, relative to origin (parent)
	width: stream(number),     // set width of element
	height: stream(number),    // set height of element
});

var Instance = object({
	$el: JQuery,               // root element
	minWidth: stream(number),          // parent component may use this to update the width of the instance
	minHeight: stream(number), // parent component may be interested
	destroy: func(),           // completely remove instance
});

var Component = object({
	create: func([Context], Instance),
	and: function () {
		return func([or([
			func([Instance], func([], promise())),
			func([Instance], func()),
			func([Instance], Bottom),
		])], Component);
	},
	all: function () {
		return func([list(or([
			func([Instance], func([], promise())),
			func([Instance], func()),
			func([Instance], Bottom),
		]))], Component);
	},
});

var Stream = {
	create: function (onValue) {
		var lastValue;
		var listeners = [];

		var pushValue = function (v) {
			if (lastValue !== v) {
				lastValue = v;
				listeners.map(function (f) {
					return f(v);
				});
			}
		};

		onValue(pushValue);

		return {
			map: function (f) {
				if (lastValue !== undefined) {
					f(lastValue);
				}
				listeners.push(f);
				
				return Stream.create(function (cb) {
					if (lastValue !== undefined) {
						cb(f(lastValue));
					}
					listeners.push(function (v) {
						cb(f(v));
					});
				});
			},
			push: pushValue,
			pushAll: function (s) {
				this.map(function (v) {
					s.push(v);
				});
			},
		};
	},
	once: function (v) {
		return Stream.create(function (cb) {
			cb(v);
		});
	},
	never: function () {
		return Stream.create(function () {});
	},
	combine: function (streams, f) {
		var arr = [];
		return Stream.create(function (cb) {
			var tryRunF = function () {
				for (var i = 0; i < streams.length; i++) {
					if (arr[i] === undefined) {
						return;
					}
				}
				cb(f.apply(null, arr));
			};

			streams.reduce(function (i, stream) {
				stream.map(function (v) {
					arr[i] = v;
					tryRunF();
				});
				return i + 1;
			}, 0);
		});
	},
};

var child = function (component) {
	return function (i) {
		i.child(component);
	};
};
var children = function (components) {
	return function (i) {
		i.children(components);
	};
};
var wireChildren = function (f) {
	return function (i) {
		i.wireChildren = f;
	};
};

// add some syntactic sugar for calling and and all
var component = type(
	func([func([Context], Instance)], Component),
	function (build) {
		var comp = {
			create: function (context) {
				var instance = this.build(context);

				instance.wireChildren = instance.wireChildren || function () {};
				var resultContexts = instance.wireChildren.apply(null, [instance, context].concat(instance.childInstances)) || [];
				
				for (var i = 0; i < instance.childInstances.length; i++) {
					var resultContext = resultContexts[i] || {};
					
					var childInstance = instance.childInstances[i];
					var childContext = instance.childContexts[i];

					var applyResult = function (resultContext, childInstance, childContext) {
						resultContext = resultContext || {};
						(resultContext.top || Stream.once(0)).pushAll(childContext.top);
						(resultContext.left || Stream.once(0)).pushAll(childContext.left);
						(resultContext.width || childInstance.minWidth).pushAll(childContext.width);
						(resultContext.height || childInstance.minHeight).pushAll(childContext.height);
					};

					if ($.isArray(childInstance)) {
						var resultContexts = resultContext;
						var childInstances = childInstance;
						var childContexts = childContext;
						for (var j = 0; j < childInstances.length; j++) {
							var resultContext = resultContexts[j];
							var childInstance = childInstances[j];
							var childContext = childContexts[j];
							applyResult(resultContext, childInstance, childContext);
						}
					}
					else {
						applyResult(resultContext, childInstance, childContext);
					}
				}
				
				return instance;
			},
			build: build,
			and: function (f) {
				var that = this;
				var c = $.extend({}, that);
				c.build = function (context) {
					var i = that.build(context);
					var destroyF = f(i, context);
					var destroy = i.destroy;
					if (destroyF) {
						i.destroy = function () {
							var p = destroyF();
							if (p) {
								p.then(function () {
									destroy();
								});
							}
							else {
								destroy();
							}
						};
					}
					return i;
				};
				return c;
			},
			all: function (fs) {
				return fs.reduce(function (c, f) {
					return c.and(f);
				}, this);
			},
		};
		return comp;
	});

var findMinWidth = function ($el) {
	var $sandbox = $('.sandbox');
	var $clone = $el.clone();
	$clone.css('width', '')
		.appendTo($sandbox);
	
	var width = parseInt($clone.css('width'));
	
	$clone.remove();

	return width;
};

var findMinHeight = function ($el) {
	var $sandbox = $('.sandbox');
	var $clone = $el.clone();
	$clone.css('height', '')
		.appendTo($sandbox);
	
	var height = parseInt($clone.css('height'));
	
	$clone.remove();

	return height;
};

var el = type(
	func(string, Component),
	function (name) {
		return component(function (context) {
			var $el = $(document.createElement(name));
			context.$el.append($el);

			context.top.map(function (t) {
				updateWindowWidth();
				$el.css('top', px(t));
			});
			context.left.map(function (l) {
				$el.css('left', px(l));
			});
			context.width.map(function (w) {
				$el.css('width', px(w));
			});
			context.height.map(function (h) {
				updateWindowWidth();
				$el.css('height', px(h));
			});

			var minWidth = Stream.once(0);
			var minHeight = Stream.once(0);

			var allContexts = [];
			var allInstances = [];

			var scrollStream = Stream.combine([context.scroll, context.top], function (scroll, top) {
				return scroll - top;
			});
			var newCtx = function () {
				return {
					$el: $el,
					scroll: scrollStream,
					top: Stream.once(0),
					left: Stream.once(0),
					width: Stream.never(),
					height: Stream.never(),
				};
			};
			
			return {
				$el: $el,
				optimalWidth: 0,
				minWidth: minWidth,
				minHeight: minHeight,
				childContexts: allContexts,
				childInstances: allInstances,
				child: function (component) {
					var ctx = newCtx();
					allContexts.push(ctx);
					allInstances.push(component.create(ctx));
				},
				children: function (components) {
					var contexts = [];
					var instances = [];
					
					components.map(function (c) {
						var ctx = newCtx();
						contexts.push(ctx);
						instances.push(c.create(ctx));
					});
					
					allContexts.push(contexts);
					allInstances.push(instances);
				},
				destroy: function () {
					minWidth.push(0);
					minHeight.push(0);
					
					for (var i = 0; i < allInstances.length; i++) {
						this.allContexts.map(function (child) {
							if (child.instances) {
								child.instances.map(function (i) {
									i.destroy();
								});
							}
							else {
								child.instance.destroy();
							}
						});
					}
					
					$el.remove();
				},
			};
		});
	});


// div :: Component
var a = el('a');
var div = el('div');
var img = el('img');
var input = el('input');
var li = el('li');
var textarea = el('textarea');
var ul = el('ul');

var rootContext = function () {
	return type(Context, {
		$el: $('body'),
		top: Stream.once(0),
		left: Stream.once(0),
		scroll: windowScroll,
		width: windowWidth,
		height: Stream.never(),
	});
};

var rootComponent = function (component) {
	var context = rootContext();
	var instance = component.create(context);
	instance.minHeight.pushAll(context.height);
	return instance;
};
