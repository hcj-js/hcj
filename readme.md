# hcj.js #

A javascript library for web app frontend templating

## What's it like ##

1. Define Components.
2. ???
3. Profit!

## How it works ##

A Component is a function.  Each time one is called, it creates an instance of itself.  A Component takes one argument: a JQuery object to append the new instance to.  It returns an object with two properties: ```$el```, a JQuery object that is the root of the instance, and ```unbind```, a function to completely remove the instance.

Besides appending an element to its argument, what can a Component do?  Absolutely anything.  It can sign up event handlers anywhere on the page, set up periodic server calls, you name it.  The ```unbind``` function must unhook any of that jazz, as it removes the component instance.

Primitive components are functions for creating DOM nodes, that is tags and text nodes.  This library gives you the components ```a```, ```div```, and ```img```, for those elements.  It also gives you a function ```textNode``` which takes a string and returns a componet.  E.g. ```textNode('Hello World')``` is a component.

### Simple Example ###

Appends a div containing 'Hello World' to the body, and removes it after 5 seconds.

```
var $body = $('body');

var hello = append(div, textNode('Hello World'));
var instance = hello($body);

setTimeout(function () {
  instance.unbind();
}, 5000);
```

### How it works, Continued ###

The meat of the library is (read: will be) found in all of the functions that transform Components.  You build complex components by composing functions around simple components.  For instance, the ```append``` function used in the example above takes two components and returns a new component.

### Simple example from recent site ###

```
var fixedHeader = function (config, header, body) {
  var headerHeight = config.height + 2 * config.padding + 1;
	return concat([
		all([
			and(function (i) {
				i.$el.css('width', px(window.innerWidth - 2 * config.padding));
			}),
			$css('height', px(config.height)),
			$css('position', 'fixed'),
			$css('top', '0'),
			$css('z-index', '1000'),
			$css('background-color', 'white'),
		])(header(config)),
		$css('margin-top', px(headerHeight))(body),
	]);
};
```

This ```fixedHeader``` function takes three arguments.  Its job is to insert the header component into a ```position:fixed``` div of a configured height, at the top of the screen; and to insert the page body into a div with top padding to compensate for the fixed header.

Reading from top to bottom: the function expects ```config``` to have two properties, and they are both used to compute the height of the header.

The ```concat``` function takes an array of components.  When instanced, it instances all of the components you passed in, appending them all to its own root element one after another.

The ```all``` function takes an array of functions from components to components, and applies them all to a component.


TODO: finish the readme
