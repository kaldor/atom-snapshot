/*global phantom*/

(function() {

  'use strict';

  var page = require( 'webpage' ).create();
  var args = require( 'system' ).args;

  function formatSnapshotFilename( title ) {
    return title.toLowerCase().replace( /\s/g,'-' );
  }

  function snapshot( options ) {

    options.start = options.start || 0;
    options.end = options.end || options.articles.length;

    if ( options.start === options.end ) {
      options.done();
    }

    var article = options.articles[ options.start ];

    page.open( article.link, function() {

      page.viewportSize = {
        width: args[ 4 ]
      };

      page.render( options.outputDir + '/' + formatSnapshotFilename( article.title ) + '.' + options.format );
      options.start++;

      snapshot.call( null, options );

    });

  }

  snapshot({
    articles: JSON.parse( args[ 1 ] ),
    format: args[ 2 ],
    outputDir: args[ 3 ],
    done: phantom.exit
  });

})();
