/*global phantom*/

(function() {

  'use strict';

  var Webpage = require( 'webpage' );
  var args = require( 'system' ).args;
  var Promise = require( 'promise' );
  var _ = require( 'lodash' );

  var format = args[ 2 ];
  var outputDir = args[ 3 ];
  var width = args[ 4 ];
  var height = args[ 5 ];
  var quality = args[ 6 ];

  function formatSnapshotFilename( id, width, height ) {
    return id + '.' + width + 'x' + height;
  }

  var createSnapshotPromise = function( article ) {
    return new Promise( function( resolve ) {

      var destination = outputDir + '/' + formatSnapshotFilename( article.id, width, height ) + '.' + format,
        page;

      if ( article.update ) {

        page = Webpage.create();

        page.viewportSize = {
          width: width,
          height: height
        };

        page.open( article.path, function() {

          page.clipRect = {
            width: width,
            height: height
          };

          page.render( destination, {
            format: format,
            quality: quality
          });

          console.log( 'Snapshotted', destination );
          resolve();
        });
      } else {
        console.log( destination, 'is up to date' );
        resolve();
      }
    });
  };

  var articles = JSON.parse( args[ 1 ] );
  var snapshotPromises = _.map( articles, createSnapshotPromise );

  Promise.all( snapshotPromises ).done( phantom.exit );
})();
