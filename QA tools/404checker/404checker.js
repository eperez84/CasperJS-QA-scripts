#!/usr/local/bin/python2.7
/**
 * This casper scipt checks for 404 internal links for a given root url.
 *
 * Usage:
 *
 *     $ casperjs 404checker.js http://mysite.tld/
 *     $ casperjs 404checker.js http://mysite.tld/ --max-depth=42
 */

/*global URI*/

var casper = require("casper").create({
    pageSettings: {
        loadImages: false,
        loadPlugins: false
    }
});
var checked = [];
var currentLink = 0;
var fs = require('fs');
var upTo = ~~casper.cli.get('max-depth') || 200;
var url = casper.cli.get(0);
var baseUrl = url;
var links = [url];
var utils = require('utils');
var f = utils.format;

// Arrays for URLs that threw an error
var errors404 = [];
var errors500 = [];

function absPath(url, base) {
    return new URI(url).resolve(new URI(base)).toString();
}

// Clean links
function cleanLinks(urls, base) {
    return utils.unique(urls).filter(function(url) {
        return url.indexOf(baseUrl) === 0 || !new RegExp('^(#|ftp|javascript|http)').test(url);
    }).map(function(url) {
        return absPath(url, base);
    }).filter(function(url) {
        return checked.indexOf(url) === -1;
    });
}

// Opens the page, perform tests and fetch next links
function crawl(link) {
    this.start().then(function() {
        this.echo(link, 'COMMENT');
        this.open(link);
        checked.push(link);
    });
    this.then(function() {
        if (this.currentHTTPStatus === 404) {
            this.warn(link + ' is missing (HTTP 404)');
            errors404.push(link);
        } else if (this.currentHTTPStatus === 500) {
            this.warn(link + ' is broken (HTTP 500)');
            errors500.push(link);
        } else {
            this.echo(link + f(' is okay (HTTP %s)', this.currentHTTPStatus));
        }
    });
    this.then(function() {
        var newLinks = searchLinks.call(this);
        links = links.concat(newLinks).filter(function(url) {
            return checked.indexOf(url) === -1;
        });
        this.echo(newLinks.length + " new links found on " + link);
    });
}

// Fetch all <a> elements from the page and return
// the ones which contains a href starting with 'http://'
function searchLinks() {
    return cleanLinks(this.evaluate(function _fetchInternalLinks() {
        return [].map.call(__utils__.findAll('a[href]'), function(node) {
            return node.getAttribute('href');
        });
    }), this.getCurrentUrl());
}

// As long as it has a next link, and is under the maximum limit, will keep running
function check() {
    if (links[currentLink] && currentLink < upTo) {
        crawl.call(this, links[currentLink]);
        currentLink++;
        this.run(check);
    } else {
        this.echo("All done, " + checked.length + " links checked.");
        if (errors404.length > 0 || errors500.length > 0) {
            if(errors404.length > 0) {
                this.warn("404 error encountered on " + errors404.length + " URL(s):");
                for(i = 0; i < errors404.length; i++) {
                    this.echo(errors404.toString(i));
                };
            };

            if(errors500.length > 0) {
                this.warn("500 error encountered on " + errors500.length + " URL(s):");         
                for(i = 0; i < errors500.length; i++) {
                    this.echo(errors500[i]);      
                };
            };
            this.exit(1);
        }
        else {
            this.echo("PASS - No 404 or 500 errors encountered")
            this.exit(0);
        }
    }
}

if (!url) {
    casper.warn('No url passed, aborting.').exit(1);
}


casper.start('https://js-uri.googlecode.com/svn/trunk/lib/URI.js', function() {
    var scriptCode = this.getPageContent() + '; return URI;';
    window.URI = new Function(scriptCode)();
    if (typeof window.URI === "function") {
        this.echo('URI.js loaded');
    } else {
        this.warn('Could not setup URI.js').exit(1);
    }
});

casper.run(process);


function process() {
    casper.start().then(function() {
        this.echo("Starting");
    }).run(check);
}
