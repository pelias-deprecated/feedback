/**
 * Given a path to a `pelias/acceptance-tests` tests JSON file, add the tests
 * in the local Mongo server's Pelias collection (as stored by the feedback
 * app) to it.
 */

var fs = require( 'fs' );
var git = require( 'nodegit' );
var mongo = require( 'mongodb' );
var monk = require( 'monk' );
var db = monk( 'localhost:27017/pelias' );

/**
 * Extract tests-cases from Mongo, conform them to the
 * `pelias/acceptance-tests` format, inject them into the `testsJson` object,
 * and pass it to `cb()`.
 */
function addTests( testsJson, cb ){
  var peliasCollection = db.get( 'pelias' );

  peliasCollection.find({}, function (err, docs){
    if( err ){
      console.error( err );
      process.exit( 1 );
    }

    docs.forEach( function ( doc ){
      var expectedOutput = null;
      if( doc.foundInPelias ){
        var testCaseProps = doc.selected[ 0 ].properties;
        delete testCaseProps.id;
        expectedOutput = testCaseProps;
      }
      else if( 'selected' in doc ){
        expectedOutput = doc.selected[ 0 ].display_name;
      }

      testsJson.tests.push({
        id: 1,
        user: 'feedback-app',
        in: {
          input: doc.query
        },
        out: expectedOutput
      });
    });

    cb( testsJson );
    db.close();
  });
}

/**
 * Modify the JSON tests file specified by `testFilePath`, adding test cases to
 * its `tests` property.
 */
function updateTestFile( testFilePath ){
  var testsJson = JSON.parse(fs.readFileSync( testFilePath ));
  addTests( testsJson, function writeNewFile( newTestJson ){
    fs.writeFile( testFilePath, JSON.stringify( newTestJson, undefined, 2 ) );
  });
}

if( process.argv.length !== 3 ){
  console.error(
    'Incorrect number of arguments. Usage:\n\n' +
    '\tnode generate_tests.js PATH/TO/acceptance-tests/test_cases/search.json'
  );
  process.exit( 1 );
}
else {
  updateTestFile( process.argv[ 2 ] );
}
