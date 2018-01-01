// Gets content for all docs pages, concatenates them together, and
// outputs the result to stdout.
console.error = function () {
  require("system").stderr.write(Array.prototype.join.call(arguments, ' ') + '\n');
};
var page = require('webpage').create();
var url = 'http://localhost:7000/docs.html';

// output the console message after a special string
var done = false;
page.onConsoleMessage = function (message) {
  if (done) {
    console.log(message);
    phantom.exit();
  }
  else if (message === 'PRERENDER DONE') {
    done = true;
  }
  else if (message.indexOf('Doing page') !== -1) {
    console.error(message);
  }
  else {
    console.error(message);
  }
};

page.open(url, function (status) {
  // just exit if status is not success
  if (status !== 'success') {
    console.log('status: ' + status);
    phantom.exit();
  }

  // do the thing
  page.evaluate(function () {
    hcj.stream.defer(function () {
      var str = '';
      var firstPage = 0;
      var countPages = $('.sidebar > a').length; // number of links in sidebar
      var appendPage = function (index) {
        console.log('Doing page ' + index + '...');
        // if at last page, end
        if (index - firstPage === countPages) {
          console.log('PRERENDER DONE');
          console.log(str);
        }
        // otherwise do page
        window.location.hash = '#' + index;
        hcj.stream.defer(function () {
          str += $('.root-component')[0].innerHTML;
          str += '\n\n';
          appendPage(index + 1);
        });
      };
      appendPage(firstPage);
    });
  });
});
