/*global phantom*/

(function() {

  'use strict';

  var page = require( 'webpage' ).create();
  var args = require( 'system' ).args;

  var width = args[ 4 ];
  var height = args[ 5 ];

  page.viewportSize = {
    width: width,
    height: height
  };

  function formatSnapshotFilename( id, width, height ) {
    return id + '.' + width + 'x' + height;
  }

  function snapshot( options ) {

    options.start = options.start || 0;
    options.end = options.end || options.articles.length;

    if ( options.start === options.end ) {
      options.done();
    }

    var article = options.articles[ options.start ];

    if ( article.update ) {
      page.open( article.path, function() {

        page.clipRect = {
          width: width,
          height: height
        };

        page.render( options.outputDir + '/' + formatSnapshotFilename( article.id, options.width, options.height ) + '.' + options.format, {
          format: options.format,
          quality: options.quality
        });

        options.start++;
        snapshot.call( null, options );

      });
    } else {
      options.start++;
      snapshot.call( null, options );
    }

  }

  snapshot({
    articles: JSON.parse( args[ 1 ] ),
    format: args[ 2 ],
    outputDir: args[ 3 ],
    quality: args[ 6 ],
    width: width,
    height: height,
    done: phantom.exit
  });

})();
