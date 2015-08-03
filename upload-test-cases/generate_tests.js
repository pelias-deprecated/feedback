/**
 * Given a path to a `pelias/fuzzy-tests` tests JSON file, add the tests
 * in the local Mongo server's Pelias collection (as stored by the feedback
 * app) to it.
 */

var fs = require( 'fs' );
var path = require( 'path' );
// var mongo = require( 'mongodb' );
var monk = require( 'monk' );
var db = monk( 'localhost:27017/pelias' );

/**
 * Move all documents in the `pelias` collection to a "backup" `pelias-backup`
 * collection and wipe `pelias`. Call `cb` when finished.
 */
function backupCollection( cb ){
  var peliasCollection = db.get( 'pelias' );
  peliasCollection.find({}, function (err, docs){
    db.get( 'peliasBackup' ).insert( docs, function (){
      peliasCollection.remove( {}, function (){
        cb();
      });
    });
  });
}

/**
 * Given `oldTests`, which should be the `tests` array property of an
 * fuzzy-tests suite, and `newDocs`, which is an array of documents
 * extracted from Mongo, create new test-cases from the `newDocs` records and
 * inject them into `oldTests`.
 */
function addTests( oldTests, newDocs ){
  var existingInputs = oldTests.map( function ( test ){
    return test.in.input;
  });

  var timestamp = new Date().getTime().toString() + ':';
  var testCaseId = 0;
  newDocs.forEach( function ( doc ){
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

    if( doc.foundInPelias ){
      testCase.status = 'pass';
      testCase.expected.properties = doc.selected.map( function ( selectedItem ){
        delete selectedItem.properties.id;
        return selectedItem.properties;
      });
    }
    else if( 'selected' in doc && doc.selected.length > 0 ){
      testCase.expected.properties = doc.selected[ 0 ].display_name;
    }

    if( doc.foundInPelias ){
      for( var ind = doc.results.length - 1; ind >= 0; ind-- ){
        if( doc.results[ ind ].icon === 'check' ){
          testCase.expected.priorityThresh = ind + 1;
          break;
        }
      }
    }

    oldTests.push(testCase);
  });
}

/**
 * Create test-cases for all documents in `newDocs` and inject them into the
 * test-suite file at `path`.
 */
function updateTestFile( path, newDocs ){
  var existingTests = JSON.parse( fs.readFileSync( path ) );
  addTests( existingTests.tests, newDocs );
  fs.writeFileSync( path, JSON.stringify( existingTests, undefined, 2 ) );
}

/**
 * Assuming that the `pelias/fuzzy-tests` repo is cloned to an
 * `fuzzy-tests` directory sitting inside this directory, extract the
 * records stored by the feedback app from MongoDB, create passing/failing test
 * cases for them, and inject them into the `feedback_pass.json` and
 * `feedback_fail.json` files in the `test_cases/` dir in the `testDir`
 * directory.
 */
function updateTestFiles( testDir ){
  db.get( 'pelias' ).find( {}, function ( err, docs ){
    if( err ){
      console.error( err );
      process.exit( 1 );
    }

    if( docs.length === 0 ){
      console.error( 'No test cases found in the MongoDB Pelias collection.' );
      process.exit( 2 );
    }

    var passingDocs = [];
    var failingDocs = [];
    docs.forEach( function ( doc ){
      ( ( doc.foundInPelias ) ? passingDocs : failingDocs ).push( doc );
    });

    updateTestFile( path.join( testDir, 'test_cases/feedback_pass.json' ), passingDocs );
    updateTestFile( path.join( testDir, 'test_cases/feedback_fail.json' ), failingDocs );
    backupCollection( function (  ){
      db.close();
    });
  });
}

if( process.argv.length !== 3 ){
  console.error( 'Incorrect number of arguments. Usage: node generate_tests.js ' +
    '/path/to/fuzzy-tests-repo');
  process.exit( 1 );
}
else {
  updateTestFiles( process.argv[ 2 ] );
}
