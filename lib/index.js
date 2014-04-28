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

var log = {
  destination: 'snapshots/log.json',
  data: null,
  checkIfExists: function() {
    return new Promise( _.bind( function( resolve ) {
      fs.exists( this.destination, _.bind( function( exists ) {
        if ( exists ) {
          resolve();
        } else {
          this.create().done( resolve );
        }
      }, this ) );
    }, this ) );
  },
  create: function() {
    return new Promise( _.bind( function( resolve, reject ) {
      fs.writeFile( this.destination, '', function ( err ) {
        if ( err ) {
          reject( err );
        }
        resolve();
      });
    }, this ) );
  },
  read: function() {
    return new Promise( _.bind( function( resolve, reject ) {
      fs.readFile( this.destination, { encoding: 'utf8' }, _.bind( function( err, data ) {
        if ( err ) {
          reject( err );
        }
        if ( data !== '' ) {
          this.data = JSON.parse( data );
          resolve();
        } else {
          this.data = data;
          resolve();
        }
      }, this ) );
    }, this ) );
  },
  update: function( articles ) {
    return new Promise( _.bind( function( resolve, reject ) {
      fs.writeFile( this.destination, JSON.stringify( articles ), function ( err ) {
        if ( err ) {
          reject( err );
        }
        resolve( articles );
      });
    }, this ) );
  }
};

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

function getArticles( xml ) {
  var articles;

  parseString( xml, function( err, result ) {
    if ( err ) {
      throw err;
    }

    articles = _.map( result.feed.entry, function( entry ) {

      var article = getArticleData( entry ),
        logArticle = _.find( log.data, { id: article.id } ),
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

function getXML() {
  return new Promise( function( resolve, reject ) {
    http.get( feed, function(res) {
      var body = '';
      res.on('data', function( chunk ) {
        body += chunk;
      }).on('end', function() {
        resolve( body );
      });
    }).on('error', function(e) {
      reject( e );
    });
  });
}

function checkIfOutputDirExists() {
  return new Promise( function( resolve, reject ) {
    fs.exists( 'snapshots', function( exists ) {
      if ( exists ) {
        resolve();
      } else {
        fs.mkdir( 'snapshots', function( err ) {
          if ( err ) {
            reject( err );
          }
          resolve();
        });
      }
    });
  });
}

checkIfOutputDirExists().then( _.bind( log.checkIfExists, log ) )
  .then( _.bind( log.read, log ) )
  .then( getXML )
  .then( getArticles )
  .then( _.bind( log.update, log ) )
  .done( snapshotArticles );
