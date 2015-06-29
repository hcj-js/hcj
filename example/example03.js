$(function () {
	// get a jquery selector
	var $body = $('body');


	debugger;
	// A Component is a function that takes a JQuery object.  When
	// run, it attaches some stuff to the DOM.  It returns an instance
	// object.
	var instance = div($body);
	debugger;

	

	debugger;
	// You can remove the element from the DOM and have the instance
	// clean up after itself by calling the instance's destroy()
	// method.
	instance.destroy();
	debugger;



	debugger;
	// There are some built-in functions from Components to
	// Components.  Many JQuery methods have corresponding HCJ
	// methods.
	var helloWorldComponent = $html('Hello World')(div);
	var instance = helloWorldComponent($body);
	debugger;
	instance.destroy();



	
	debugger;
	// Components have helper methods you may use to apply one or more
	// of these.

	// applying one
	var componentA = div.and($html('small text'));

	// applying one or more
	var componentB = div.all([
		$html('large text'),
		$css('font-size', '50px'),
	]);
	
	var instanceA = componentA($body);
	var instanceB = componentB($body);
	debugger;
	instanceA.destroy();
	instanceB.destroy();
});
