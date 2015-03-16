/**
 * Given a path to a `pelias/acceptance-tests` tests JSON file, add the tests
 * in the local Mongo server's Pelias collection (as stored by the feedback
 * app) to it.
 */

var fs = require( 'fs' );
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

    if( docs.length === 0 ){
      console.error( 'No test cases found in the MongoDB Pelias collection.' );
      process.exit( 2 );
    }

    var existingInputs = testsJson.tests.map( function ( test ){
      return test.in.input;
    });

    var timestamp = new Date().getTime().toString() + ':';
    var testCaseId = 0;
    docs.forEach( function ( doc ){
      if( existingInputs.indexOf( doc.query ) !== -1 ){
        return;
      }
      existingInputs.push( doc.query );

      var testCase = {
        id: timestamp + testCaseId++,
        user: 'feedback-app',
        in: {
          input: doc.query
        },
        expected: {
          properties: null
        }
      };

      var expectedOutput = null;
      if( doc.foundInPelias ){
        testCase.status = 'pass';
        var testCaseProps = doc.selected[ 0 ].properties;
        delete testCaseProps.id;
        expectedOutput = testCaseProps;
        testCase.expected.properties = doc.selected.map( function ( selectedItem ){
          delete selectedItem.properties.id;
          return selectedItem.properties;
        });
      }
      else if( 'selected' in doc && doc.selected.length > 0 ){
        expectedOutput = doc.selected[ 0 ].display_name;
      }

      if( doc.foundInPelias ){
        for( var ind = doc.results.length - 1; ind >= 0; ind-- ){
          if( doc.results[ ind ].icon === 'check' ){
            testCase.expected.priorityThresh = ind + 1;
            break;
          }
        }
      }

      testsJson.tests.push(testCase);
    });

    db.get( 'peliasBackup' ).insert( docs, function (){
      peliasCollection.remove( {}, function (){
        db.close();
        cb( testsJson );
      });
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
