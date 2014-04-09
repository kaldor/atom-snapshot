#!/usr/bin/env node

var args = require( 'nopt' )({
  format: [ String ],
  outputDir: [ String ],
  feed: [ String ],
  width: [ Number ],
  height: [ Number ]
});

if ( args.feed === undefined ) {
  throw new Error( 'You must provide an atom feed using the --feed flag' );
}

var _ = require( 'lodash' );
var shell = require( 'child_process' ).execFile;
var phantomjs = require( 'phantomjs' ).path;
var Promise = require( 'promise' );
var http = require( 'http' );
var parseString = require( 'xml2js' ).parseString;
var url = require( 'url' );

function getArticles( xml ) {
  var articles;
  parseString( xml, function (err, result) {
    articles = _.map( result.feed.entry, function( entry ) {
      return {
        title: entry.title[ 0 ],
        link: url.resolve( args.feed, _.find( entry.link, {
          $: { rel: 'alternate' }
        }).$.href )
      };
    });
  });
  return articles;
}

function snapshotArticles( articles ) {
  shell( phantomjs, [
    './lib/snapshot.js',
    JSON.stringify( articles ),
    args.format || 'png',
    args.outputDir || './snapshots',
    args.width,
    args.height
  ], function( err, stdout ) {
    if ( err ) {
      throw new Error( err );
    }
    console.log( 'Snapshotting finished', stdout);
  });
}

var getXML = new Promise(function (resolve, reject) {
  http.get( args.feed, function(res) {
    var body = '';
    res.on('data', function (chunk) {
      body += chunk;
    }).on('end', function() {
      resolve(body);
    });
  }).on('error', function(e) {
    reject(e);
  });
});

getXML.then( getArticles ).done( snapshotArticles );
