/*global phantom*/

(function() {

  'use strict';

  var Webpage = require( 'webpage' );
  var args = require( 'system' ).args;
  var Promise = require( 'promise' );
  var _ = require( 'lodash' );

  var articles = JSON.parse( args[ 1 ] );
  var format = args[ 2 ];
  var outputDir = args[ 3 ];
  var width = args[ 4 ];
  var height = args[ 5 ];
  var quality = args[ 6 ];
  var dimensions = (function() {
    if ( args[ 7 ] !== 'undefined' ) {
      return _.map( args[ 7 ].split(','), function( dimension ) {
        return dimension.split('x');
      });
    } else {
      return [
        [ width, height ]
      ];
    }
  })();

  function formatSnapshotFilename( id, width, height ) {
    return id + '.' + width + 'x' + height;
  }

  function renderSnapshot( page, format, quality, destination, cb ) {
    page.render( destination, {
      format: format,
      quality: quality
    });

    console.log( 'Snapshotted', destination );
    cb();
  }

  function setClipRect( page, width, height ) {
    page.clipRect = {
      width: width,
      height: height
    };
  }

  function setViewPortSize( page, width, height ) {
    page.viewportSize = {
      width: width,
      height: height
    };
  }

  function snapshotIsDelayed() {
    return this.evaluate(function() {
      return document.querySelector( 'meta[name="delaySnapshotUntilReady"]') || false;
    });
  }

  function createSnapshotPromise( article ) {
    return _.map( dimensions, function( dimension ) {
      return new Promise( function( resolve ) {

        var width = dimension[0],
          height = dimension[1],
          destination = outputDir + '/' + formatSnapshotFilename( article.id, width, height ) + '.' + format,
          page;

        if ( article.update ) {
          page = Webpage.create();

          page.onResourceError = function(request) {
            if ( request.url === 'pugpig://onpageready' ) {
              _.defer(function() {
                renderSnapshot( page, format, quality, destination, resolve );
              });
            }
          };

          setViewPortSize( page, width, height );

          page.open( article.path, function() {
            setClipRect( page, width, height );

            if ( !snapshotIsDelayed.call( this ) ) {
              renderSnapshot( page, format, quality, destination, resolve );
            }
          });
        } else {
          console.log( destination, 'is up to date' );
          resolve();
        }
      });
    });
  }

  Promise.all(
    _.flatten( _.map( articles, createSnapshotPromise ) )
  ).done( phantom.exit );
})();
