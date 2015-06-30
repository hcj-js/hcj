var type = function (t, obj) {
	if (type.DEACTIVATE) {
		return obj;
	}
	else {
		return t.check(obj, function (o, name) {
			var oName = '';
			if ($.type(o) === 'function') {
				oName = 'function';
			}
			else {
				oName = JSON.stringify(o);
			}
			message = 'type error: ' + oName + ' is not a ' + name;
			console.warn(message);
		});
	}
};

var id = function (obj) {
	return obj;
};


// everything is a Bottom
var Bottom = {
	check: function (obj) {
		return obj;
	},
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
			var newObj = obj;
			var matches = [];
			var tryIndex = function (i, data) {
				if (i === tys.length) {
					return typeError(obj, 'or');
				}
				newObj = tys[i].check(obj, function (a, b, data) {
					return tryIndex(i + 1, data);
				}, data);
			};
			tryIndex(0);

			return newObj;
		},
	};
};


var array = function (ty) {
	return {
		check: function (obj, typeError) {
			var name = 'array(' + (ty ? ty.name : '') + ')';
			
			if ($.type(obj) !== 'array') {
				typeError(obj, name);
				return obj;
			}
			if (ty) {
				return obj.map(function (v) {
					return type(ty, v);
				});
			}
			else {
				return obj;
			}
		},
	};
};


var promise = function (ty) {
	return {
		check: function (obj, typeError) {
			var error = false;
			func().check(obj.then, function () {
				typeError();
				error = true;
			});
			if (error || !ty) {
				return obj;
			}
			else {
				return obj.then(function (result) {
					return type(ty, result);
				});
			}
		},
	};
};


var stream = function (ty) {
	return {
		check: function (obj, typeError) {
			instance(Bacon.EventStream, 'stream').check(obj, typeError);
			if (ty) {
				return obj.map(function (v) {
					return type(ty, v);
				});
			}
			else {
				return obj;
			}
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

var enumeration = function (options) {
	return {
		check: function (obj, typeError) {
			var matchesOne = false;
			options.map(function (o) {
				if (o === obj) {
					matchesOne = true;
				}
			});
			if (!matchesOne) {
				typeError();
			}
			return obj;
		}
	};
};

var oneOf = function (defs) {
	var tagProp = '_tag';
	
	var ty = {
		check: function (obj, typeError) {
			return def[obj[tagProp]].check(obj, typeError);
		}
	};

	for (var key in defs) {
		var def = defs[key];
		
		ty[key] = function (obj) {
			obj = type(def, obj);
			obj[tagProp] = key;
		};
	};

	return ty;
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


var func = function (types, o) {
	return {
		name: 'func',
		check: function (obj, typeError, oldResult) {
			if ($.type(obj) !== 'function') {
				typeError();
			}
			var checkResult = function (args, result) {
				if (o) {
					if ($.type(o) === 'function') {
						return o.apply(window, args).check(result, function (a, b, resultResult) {
							return typeError(obj, 'func', {
								args: args,
								result: result,
								resultResult: resultResult,
							});
						}, oldResult.resultResult);
					}
					else {
						return o.check(result, function (a, b, resultResult) {
							return typeError(obj, 'func', {
								args: args,
								result: result,
								resultResult: resultResult,
							});
						}, oldResult.resultResult);
					}
				}
				else {
					return result;
				}
			};
			var checkArgs = function (args) {
				if (types) {
					if ($.type(types) !== 'array') {
						types = [types];
					}
					for (var i = 0; i < types.length; i++) {
						args[i] = types[i].check(args[i], function () {
							typeError(obj, 'func', {
								args: args,
							});
						});
					}
				}
				if (oldResult.result) {
					return checkResult(args, oldResult.result);
				}
				var result = obj.apply(window, args);
				return checkResult(args, result);
			};

			oldResult = oldResult || {};
			if (oldResult.args) {
				return checkArgs(oldResult.args);
			}
			return function () {
				var args = arguments;
				return checkArgs(args);
			};
		},
	};
};


var Type = object({
	check: func(),
});


var poly = function () {

	var instances = [];

	var f = function () {
		for (var i = 0; i < instances.length; i++) {
			var instanceMatches = true;
			var instance = instances[i];

			for (var j = 0; j < instance.args.length; j++) {
				var arg = instance.args[j];

				arg.check(arguments[j], function () {
					instanceMatches = false;
				});
			}

			if (instanceMatches) {
				return instance.impl.apply(window, arguments);
			};
		}

		console.warn('no instance found');
		debugger;
	};

	f.instance = type(
		func([array(Type), func()]),
		function (args, impl) {
			instances.push({
				args: args,
				impl: impl,
			});
		});

	return f;
};

var map = poly();
map.instance([array()], function (arr, f) {
	return arr.map(f);
});
map.instance([promise()], function (p, f) {
	return p.then(f);
});

var reduce = poly();
reduce.instance([array()], function (arr, f, i) {
	return arr.reduce(f, i);
});
