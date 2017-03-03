// Gets content for all docs pages, concatenates them together, and
// outputs the result to stdout.

var page = require('webpage').create();
var url = 'http://localhost:7000/docs.html';

// output the console message after a special string
var done = false;
page.onConsoleMessage =function (message) {
  if (done) {
    console.log(message);
    phantom.exit();
  }
  if (message === 'PRERENDER DONE') {
    done = true;
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
      var countPages = $('div.stack:nth-child(3) > a').length; // number of links in sidebar
      var appendPage = function (index) {
        // if at last page, end
        if (index - firstPage === countPages) {
          console.log('PRERENDER DONE');
          console.log(str);
        }
        // otherwise do page
        window.location.hash = '#' + index;
        hcj.stream.defer(function () {
          // add page content to str
          if (index === firstPage) {
            // if first page, include sidebar
            str += $('.root-component')[0].innerHTML;
          }
          else {
            str += $('div.margin:nth-child(2)')[0].innerHTML;
          }
          str += '\n\n';
          appendPage(index + 1);
        });
      };
      appendPage(firstPage);
    });
  });
});
