#!/usr/bin/env node

var args = require( 'nopt' )({
    format: [ String ],
    outputDir: [ String ],
    width: [ Number ],
    height: [ Number ],
    quality: [ Number ]
  }, {}, process.argv, 3 ),
  feed = process.argv[ 2 ];

if ( feed === undefined ) {
  throw new Error( 'You must provide an atom feed as the first argument' );
}

var path = require( 'path' );
var fs = require( 'fs' );
var _ = require( 'lodash' );
var shell = require( 'child_process' ).execFile;
var phantomjs = require( 'phantomjs' ).path;
var Promise = require( 'promise' );
var http = require( 'http' );
var parseString = require( 'xml2js' ).parseString;
var url = require( 'url' );

function getArticlePathFromEntry( entry ) {
  return url.resolve( feed, _.find( entry.link, {
    $: { rel: 'alternate' }
  }).$.href );
}

function getArticleIdFromEntry( entry ) {
  return entry.id[ 0 ];
}

function getArticles( xml ) {
  var articles;
  parseString( xml, function (err, result) {
    articles = _.map( result.feed.entry, function( entry ) {
      return {
        id: getArticleIdFromEntry( entry ),
        path: getArticlePathFromEntry( entry )
      };
    });
  });
  return articles;
}

function snapshotArticles( articles ) {

  shell( phantomjs, [
    path.join( path.dirname( fs.realpathSync(__filename) ), '/snapshot.js' ),
    JSON.stringify( articles ),
    args.format || 'png',
    args.outputDir || 'snapshots',
    args.width || 768,
    args.height || 1024,
    args.quality || 100
  ], function( err ) {
    if ( err ) {
      throw err;
    }
    console.log( 'Snapshotting finished' );
  });
}

var getXML = new Promise(function (resolve, reject) {
  http.get( feed, function(res) {
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
