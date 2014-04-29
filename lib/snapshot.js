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

  function formatSnapshotFilename( id, width, height ) {
    return id + '.' + width + 'x' + height;
  }

  function createSnapshotPromise( article ) {
    return new Promise( function( resolve ) {

      var destination = outputDir + '/' + formatSnapshotFilename( article.id, width, height ) + '.' + format,
        page;

      if ( article.update ) {

        page = Webpage.create();

        page.onResourceError = function(request) {
          if ( request.url === 'pugpig://onpageready' ) {
            _.defer( function() {
              page.render( destination, {
                format: format,
                quality: quality
              });

              console.log( 'Snapshotted', destination );
              resolve();
            });
          }
        };

        page.viewportSize = {
          width: width,
          height: height
        };

        page.open( article.path, function() {

          var delaySnapshot = this.evaluate(function() {
            return document.querySelector( 'meta[name="delaySnapshotUntilReady"]') || false;
          });

          page.clipRect = {
            width: width,
            height: height
          };

          if ( !delaySnapshot ) {
            page.render( destination, {
              format: format,
              quality: quality
            });

            console.log( 'Snapshotted', destination );
            resolve();
          }

        });
      } else {
        console.log( destination, 'is up to date' );
        resolve();
      }
    });
  }

  Promise.all(
    _.map( articles, createSnapshotPromise )
  ).done( phantom.exit );
})();
