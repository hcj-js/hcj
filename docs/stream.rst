Stream
======

Hcj comes with a small FRP library.  With it you can create data
streams, and then map, reduce, and filter them, along with some other
operations.


stream.fromEvent
----------------

Creates a stream of DOM events, using an event handler internally.

First parameter is a JQuery selector.  Second parameter is an event.

.. code-block:: javascript

  var bodyClickS = stream.fromEvent($('body'), 'click');

stream.fromPromise
----------------

Creates a stream out of a promise.

First parameter is a promise.  Second parameter is an optional initial
value.

.. code-block:: javascript

  var profilesS = stream.fromPromise($.get('/profiles'), []);

stream.create
-------------

Creates an empty stream.

.. code-block:: javascript

 var s = stream.create();

stream.once
-----------

Creates a stream with a single value.

.. code-block:: javascript

 var s = stream.once("initial value");

stream.push
-----------

Pushes a value onto a stream.  Treats the stream as if it were a bus.
As a rule of thumb, only call `push` on a stream that you created
earlier with `create` or `once` with the intention of pushing to
it.

.. code-block:: javascript

 var s = stream.create();
 stream.push(s, "some value");

Don't push values onto other people's streams, okay kids?

stream.map
----------

Applies a function to each point on a stream.  Returns a stream of the
results.

.. code-block:: javascript

  // stream of DOM events
  var valueChangedS = stream.fromEvent($input, 'change');

  // stream of numbers
  var valueS = stream.map(valueChangedS, function (ev) {
    return $(ev.target).val();
  });

stream.reduce
-------------

Applies a function to each point on a stream.  Function also receives
last value of output stream - and `reduce` takes an initial value for
output stream.

.. code-block:: javascript

  var numbersS = // ...

  var sumS = stream.reduce(numbersS, function (a, b) {
    return a + b;
  }, 0);

stream.filter
-------------

Applies a function to each point on a stream.  If the result is
truthy, the point is pushed to the output stream.  If not, it is not.

.. code-block:: javascript

  var numberS = // ...

  var numberGreaterZeroS = stream.filter(numberS, function (n) {
    return n > 0;
  });

stream.combine
--------------

Applies an n-ary function to the latest values from an array of
streams.  Whenever any stream is updated, the combine function is run.

.. code-block:: javascript

  var number1S = // ...
  var number2S = // ...

  var sumS = stream.combine([
    number1S,
	number2S,
  ], function (a, b) {
    return a + b;
  });

For performance reasons, if several input streams are pushed to "at
the same time", the combine function will still only run once.  For
instance, the code

.. code-block:: javascript

  var number1S = stream.once(1);
  var number2S = stream.once(1);

  var sumS = stream.combine([
    number1S,
	number2S,
  ], function (a, b) {
    var sum = a + b;
    console.log(sum);
    return sum;
  });

  stream.push(number1S, 2);
  stream.push(number1S, 3);
  stream.push(number1S, 4);

  stream.push(number2S, 2);
  stream.push(number2S, 3);
  stream.push(number2S, 4);

only outputs 8.  The combine function is only called inside of a
`setTimeout` internally.  Here it is called once, using only the last
values pushed into its input streams.
