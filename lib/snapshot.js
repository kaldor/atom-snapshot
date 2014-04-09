/*global phantom*/

(function() {

  'use strict';

  var page = require( 'webpage' ).create();
  var args = require( 'system' ).args;

  function formatSnapshotFilename( path ) {
    var parts = path.split( '/' );
    return parts[ parts.length - 1 ];
  }

  function snapshot( options ) {

    options.start = options.start || 0;
    options.end = options.end || options.paths.length;

    if ( options.start === options.end ) {
      options.done();
    }

    var path = options.paths[ options.start ];

    page.open( path, function( status ) {

      page.viewportSize = {
        width: args[ 4 ]
      };

      page.render( options.outputDir + '/' + formatSnapshotFilename( path ) + '.' + options.format );
      options.start++;

      snapshot.call( null, options );

    });

  }

  snapshot({
    paths: args[ 1 ].split(','),
    format: args[ 2 ],
    outputDir: args[ 3 ],
    done: phantom.exit
  });

})();
