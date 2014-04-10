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

  function formatSnapshotFilename( title, width, height ) {
    return title.toLowerCase().replace( /\s/g,'-' ) + '.' + width + 'x' + height;
  }

  function snapshot( options ) {

    options.start = options.start || 0;
    options.end = options.end || options.articles.length;

    if ( options.start === options.end ) {
      options.done();
    }

    var article = options.articles[ options.start ];

    page.open( article.path, function() {

      page.clipRect = {
        width: width,
        height: height
      };

      page.render( options.outputDir + '/' + formatSnapshotFilename( article.title, options.width, options.height ) + '.' + options.format );
      options.start++;

      snapshot.call( null, options );

    });

  }

  snapshot({
    articles: JSON.parse( args[ 1 ] ),
    format: args[ 2 ],
    outputDir: args[ 3 ],
    width: width,
    height: height,
    done: phantom.exit
  });

})();
