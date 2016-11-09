function waitForWebfonts(fonts, callback) {
  if (fonts.length === 0) {
	callback();
	return;
  }
  var maxTime = 10 * 1000;
  var startTime = new Date().getTime();
  var loadedFonts = 0;
  var callbackIsRun = false;
  for(var i = 0, l = fonts.length; i < l; ++i) {
	(function(font) {
	  var container = document.createElement('div');
	  container.style.position = 'absolute';
	  container.style.width = 0;
	  document.body.appendChild(container);
	  var node = document.createElement('span');
	  var $node = $(node);
	  // Characters that vary significantly among different fonts
	  if (font === 'FontAwesome') {
		node.innerHTML = '<i class="fa-facebook-square"></i>';
	  }
	  else {
		node.innerHTML = " !\"\\#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~";
	  }
	  // Visible - so we can measure it - but not on the screen
	  node.style.position      = 'absolute';
	  node.style.left          = '-10000px';
	  node.style.top           = '-10000px';
	  // Large font size makes even subtle changes obvious
	  node.style.fontSize      = '300px';
	  // Reset any font properties
	  node.style.fontVariant   = 'normal';
	  node.style.fontStyle     = 'normal';
	  node.style.fontWeight    = 'normal';
	  node.style.letterSpacing = '0';
	  container.appendChild(node);

	  // Remember width with no applied web font
	  var width = $node.outerWidth();
	  if (font === 'FontAwesome') {
		node.innerHTML = '<i class="fa fa-facebook-square"></i>';
	  }
	  else {
		node.style.fontFamily = font;
	  }

	  var interval;
	  function checkFont () {
		// Compare current width with original width
		if (node && (new Date().getTime() - startTime > maxTime || $node.outerWidth() != width)) {
		  ++loadedFonts;
		  node.parentNode.removeChild(node);
		  node = null;
		  if (interval) {
			clearInterval(interval);
		  }
		}

		// If all fonts have been loaded
		if(loadedFonts >= fonts.length) {
		  if(loadedFonts == fonts.length) {
			if (!callbackIsRun) {
			  callback();
			}
			callbackIsRun = true;
			return true;
		  }
		}
	  };

	  setTimeout(function () {
		if(!checkFont()) {
		  interval = setInterval(checkFont, 50);
		}
	  });
	})(fonts[i]);
  }
};
