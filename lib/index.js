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

function getArticleUpdatedFromEntry( entry ) {
  return entry.updated[ 0 ];
}

function getArticleData( entry ) {
  return {
    id: getArticleIdFromEntry( entry ),
    path: getArticlePathFromEntry( entry ),
    updated: getArticleUpdatedFromEntry( entry )
  };
}

function getArticles( res ) {
  var log = res[ 0 ],
    xml = res[ 1 ],
    articles;

  parseString( xml, function ( err, result ) {
    articles = _.map( result.feed.entry, function( entry ) {

      var article = getArticleData( entry ),
        logArticle = _.find( log, { id: article.id } ),
        lastUpdated = logArticle ? logArticle.updated : undefined;

      if ( article.updated !== lastUpdated ) {
        article.update = true;
      }

      return article;
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

var getXML = function() {
  return new Promise(function ( resolve, reject ) {
    http.get( feed, function(res) {
      var body = '';
      res.on('data', function ( chunk ) {
        body += chunk;
      }).on('end', function() {
        resolve( body );
      });
    }).on('error', function(e) {
      reject(e);
    });
  });
};

var createLog = function() {
  return new Promise(function( resolve, reject ) {
    fs.writeFile( 'snapshots/log.json', '', function ( err ) {
      if ( err ) {
        throw err;
      }
      resolve();
    });
  });
};

var updateLog = function( articles ) {
  return new Promise(function( resolve, reject ) {
    fs.writeFile( 'snapshots/log.json', JSON.stringify( articles ), function ( err ) {
      if ( err ) {
        throw err;
      }
      resolve( articles );
    });
  });
};

var readLog = function() {
  return new Promise(function( resolve, reject ) {
    fs.readFile( 'snapshots/log.json', { encoding: 'utf8' }, function( err, data ) {
      if ( err ) {
        throw err;
      }
      resolve( JSON.parse( data ) );
    });
  });
};

var checkLogExists = function() {
  return new Promise(function ( resolve, reject ) {
    fs.exists( 'snapshots/log.json', function ( exists ) {
      if ( exists ) {
        readLog().done( resolve );
      } else {
        createLog().done( resolve );
      }
    });
  });
};

Promise.all( checkLogExists(), getXML() )
  .then( getArticles )
  .then( updateLog )
  .done( snapshotArticles );
