var type = function (t, obj) {
	if (type.DEACTIVATE) {
		return obj;
	}
	else {
		return t.check(obj, function (o, name) {
			message = 'type error: ' + JSON.stringify(o) + ' is not a ' + name;
			console.warn(message);
			debugger;
		});
	}
};


// everything is a Bottom
var Bottom = {
	check: function () {},
};


var String = {
	check: function (obj, typeError) {
		if ($.type(obj) !== 'string') {
			typeError(obj, 'string');
		}
		return obj;
	},
};


var Number = {
	name: 'number',
	check: function (obj, typeError) {
		if ($.type(obj) !== 'number') {
			typeError(obj, 'number');
		}
		return obj;
	},
};


var Boolean = {
	check: function (obj, typeError) {
		if ($.type(obj) !== 'boolean') {
			typeError(obj, 'boolean');
		}
		return obj;
	},
};


var or = function (tys) {
	return {
		check: function (obj, typeError) {
			var tryIndex = function (i) {
				if (i === tys.length) {
					return typeError(obj, 'or');
				}
				return tys[i].check(obj, function () {
					return tryIndex(i + 1);
				});
			};
			tryIndex(0);

			return obj;
		},
	};
};


var array = function (ty) {
	return {
		check: function (obj, typeError) {
			var name = 'array(' + ty.name + ')';
			
			if ($.type(obj) !== 'array') {
				typeError(obj, name);
			}
			return obj.map(function (v) {
				return type(ty, v);
			});
		},
	};
};


var object = function (desc) {
	return {
		check: function (obj, typeError) {
			if ($.type(obj) !== 'object') {
				typeError(obj, 'object');
			}
			for (var key in desc) {
				obj[key] = type(desc[key], obj[key]);
			}
			return obj;
		},
	};
};

var instance = function (klass, name) {
	return {
		name: 'instance',
		check: function (obj, typeError) {
			if (!(obj instanceof klass)) {
				typeError(obj, name);
			}
			return obj;
		},
	};
};
var JQuery = instance(jQuery, 'JQuery');


var func = function (args, o) {
	return {
		name: 'func',
		check: function (obj, typeError) {
			if ($.type(obj) !== 'function') {
				typeError();
			}
			return function () {
				if (args) {
					if ($.type(args) !== 'array') {
						args = [args];
					}
					for (var i = 0; i < args.length; i++) {
						arguments[i] = type(args[i], arguments[i]);
					}
				}
				var result = obj.apply(window, arguments);
				if (o) {
					if ($.type(o) === 'function') {
						return type(o.apply(window, arguments), result);
					}
					else {
						return type(o, result);
					}
				}
				else {
					return result;
				}
			};
		},
	};
};


var Type = object({
	name: String,
	check: func(),
});


