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

    var timestamp = new Date().getTime().toString() + ':';
    var testCaseId = 0;
    docs.forEach( function ( doc ){
      var expectedOutput = null;
      if( doc.foundInPelias ){
        var testCaseProps = doc.selected[ 0 ].properties;
        delete testCaseProps.id;
        expectedOutput = testCaseProps;
      }
      else if( 'selected' in doc && doc.selected.length > 0 ){
        expectedOutput = doc.selected[ 0 ].display_name;
      }

      var testCase = {
        id: timestamp + testCaseId++,
        user: 'feedback-app',
        in: {
          input: doc.query
        },
        out: expectedOutput
      };

      if( doc.foundInPelias ){
        for( var ind = 0; ind < doc.results.length; ind++ ){
          if( doc.results[ ind ].icon === 'check' ){
            testCase.priorityThresh = ind + 1;
          }
        }
      }

      testsJson.tests.push(testCase);
    });

    peliasCollection.remove( {}, function (){
      db.close();
      cb( testsJson );
    });
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
