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
var parseString = require('xml2js').parseString;
var url = require( 'url' );

function getPaths( xml ) {
  var articles, paths;
  parseString( xml, function (err, result) {
    articles = _.map( result.feed.entry, function( el ) {
      return _.find( el.link, { $: { rel: 'alternate' } } );
    });
    paths = _.map( articles, function( article ) {
      return url.resolve( args.feed, article.$.href );
    });
  });
  return paths;
}

function snapshotPaths( paths ) {
  shell( phantomjs, [
    './lib/snapshot.js',
    paths.toString(),
    args.format || 'png',
    args.outputDir || './snapshots',
    args.width,
    args.height
  ], function( err ) {
    if ( err ) {
      throw new Error( err );
    }
    console.log( 'Snapshotting finished' );
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

getXML.then( getPaths ).done( snapshotPaths );
