/*
*** This is a modified version of https://gist.github.com/nhoizey/4060568 ***

This script takes a screenshot of the URLs defined in testData.json using
various viewports.  Width is fixed and the height is set to whatever the
document height is in order to get the whole page.

environment: base URL
name: name of the page (screenshots are saved to a folder created with this name)
path: path of the page that needs a screenshot taken
device: name of device viewport approximates
width: width (in px) of device screen.  height is taken from documentHeight

Example:
      "environment":"http://www.google.com",
      "page":[ 
        {
          "name": "images",
          "path": "/images"
        }
      ]
      "viewports": [
        {
          "device": "iphone5-portrait",
          "viewport": {"width": 320}
        },
      }

A large collection of viewport sizes is available at: http://viewportsizes.com/
*/
var fs = require('fs');
var configFile = fs.read('./JSON/testData.json'); // path to config json
var testData = JSON.parse(configFile);
var testEnvironment = testData.environment;
var pageArray = testData.page;
var viewports = testData.viewports;
var URLarray = [];
var nameArray = [];
var documentHeight;
var pageNameCounter = 0;

var casper = require("casper").create();

var screenshotNow = new Date(),
    screenshotDateTime = screenshotNow.getFullYear() + pad(screenshotNow.getMonth() + 1) + pad(screenshotNow.getDate()) + '-' + pad(screenshotNow.getHours()) + pad(screenshotNow.getMinutes()) + pad(screenshotNow.getSeconds());

function URLconst() {

    // generate URL array by combining environment and path
    for (i = 0; i < pageArray.length; i++) {
        URLarray.push(testEnvironment + "/" + pageArray[i].path);
        nameArray.push(pageArray[i].name);
    }
    /* 
    Hack to "fix" a bug where pageNumberCounter would be ahead by 1
    and as a result was incorrectly naming the screenshot folders
    */ 
    nameArray.unshift("spacer"); 
}

  casper.start(testEnvironment, function() {
    this.echo('Taking screenshots...');
    URLconst();
  });

casper.then(function() {

      casper.eachThen(URLarray, function(response) {

        console.log("\nOpening URL: " + response.data + "\n")

          this.thenOpen(response.data, function(response) {
        /*
        Gets page height. Does this using the default viewport size, 
        so some pages may still be cut off on mobile viewport sizes
        */
        documentHeight = this.evaluate(function() {
            return __utils__.getDocumentHeight();
        });

            casper.each(viewports, function(casper, viewport) {

            // Cycles through all viewports, using the width variable and document height
            this.then(function() {
              this.viewport(viewport.viewport.width, documentHeight);
            });

            // 5 second delay to allow for page load
            this.wait(5000);

            this.then(function() {
              this.echo('Current viewport: ' + viewport.device + ' (' + viewport.viewport.width + ' px)', 'info');
                this.capture('./screenshots/' + screenshotDateTime + '/' + nameArray[pageNameCounter] + '/' + viewport.device + '-' + viewport.viewport.width + '-px.png', {
                    top: 0,
                    left: 0,
                    width: viewport.viewport.width,
                    height: documentHeight
                });
              });
            });

            // Increment the page count
            pageNameCounter++; 

          });
        });
});

casper.run();

function pad(number) {
  var r = String(number);
  if ( r.length === 1 ) {
    r = '0' + r;
  }
  return r;
}