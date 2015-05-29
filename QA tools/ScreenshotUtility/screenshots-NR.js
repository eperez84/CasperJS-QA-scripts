/*
Screenshot utility - For non-responsive sites

*** This is a modified version of https://gist.github.com/nhoizey/4060568 ***

This script takes a screenshot of the URLs defined in testData.json using
various mobile viewports.  Separate mobile and desktop user agents are used
for non-responsive sites.  Width is fixed and the height is set to whatever 
the document height is in order to capture the whole page.

environment: base URL
name: name of the page (screenshots are saved to a folder created with this name)
path: path of the page that needs a screenshot taken
device: name of device viewport approximates
width: width (in px) of device screen. Height is calculated from documentHeight
agentStringMobile and agentStringDesktop: Set these to any desktop or mobile
  browser.  NOTE: These are NOT intended to accurately emulate a specific browser.
  Their purpose is to simply force the site to serve content for either desktop
  or mobile browsers.

Example:
      "environment":"http://www.google.com",
      "agentStringMobile":"Apple-iPhone5C1", // can be set to any mobile agent
      "agentStringDesktop": "Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko", // can be set to any desktop agent
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

var pageNameCounterMobile = 0;
var pageNameCounterDesktop = 0;

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

        console.log("Using agent string " + testData.agentStringMobile);        
        console.log("\nOpening URL: " + response.data + "\n")
        this.userAgent(testData.agentStringMobile); 

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

            // 10 second delay to allow for page load
            this.wait(10000);
        
            this.then(function() {

              this.echo('Current viewport: ' + viewport.device + ' (' + viewport.viewport.width + ' px) using agent ' + testData.agentStringDesktop, 'info');
                this.capture('./screenshots/' + screenshotDateTime + '-mobile/' + nameArray[pageNameCounterMobile] + '/' + viewport.device + '-' + viewport.viewport.width + '-px.png', {
                    top: 0,
                    left: 0,
                    width: viewport.viewport.width,
                    height: documentHeight
                });             
              });

            });
            // Increment the page count
            pageNameCounterMobile++; 
            
          });
      });

      casper.eachThen(URLarray, function(response) {


        console.log("Using agent string " + testData.agentStringDesktop);        
        console.log("\nOpening URL: " + response.data + "\n")
        this.userAgent(testData.agentStringDesktop); 

        this.thenOpen(response.data, function(response) {
        /*
        Gets page height. Does this using the default viewport size, 
        so some pages may still be cut off on mobile viewport sizes
        */
        documentHeight = this.evaluate(function() {
            return __utils__.getDocumentHeight();
        });


        // 10 second delay to allow for page load
        this.wait(10000);
    
        this.then(function() {

          this.echo('Current agent: ' + testData.agentStringDesktop, 'info');
          this.capture('./screenshots/' + screenshotDateTime + '-desktop/' + nameArray[pageNameCounterDesktop] + '/' + 'desktop.png', {
                top: 0,
                left: 0,
                width: 1280,
                height: documentHeight
            });    
       
          });

          // Increment the page count
          pageNameCounterDesktop++;
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