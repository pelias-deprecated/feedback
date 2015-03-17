/**
 * Given a path to a `pelias/acceptance-tests` tests JSON file, add the tests
 * in the local Mongo server's Pelias collection (as stored by the feedback
 * app) to it.
 */

var fs = require( 'fs' );
var mongo = require( 'mongodb' );
var monk = require( 'monk' );
var db = monk( 'localhost:27017/pelias' );

function backupCollection( cb ){
  db.get( 'pelias' ).find({}, function (err, docs){
    db.get( 'peliasBackup' ).insert( docs, function (){
      peliasCollection.remove( {}, function (){
        db.close();
        cb();
      });
    });
  });
}

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

function updateTestFile( path, newDocs ){
  var existingTests = JSON.parse( fs.readFileSync( path ) );
  addTests( existingTests.tests, newDocs );
  fs.writeFileSync( path, JSON.stringify( existingTests, undefined, 2 ) );
}

function updateTestFiles(){
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
      ( ( doc.foundInPelias ) ? passingDocs : failingDocs ).push( doc )
    });

    var testDir = './acceptance-tests/test_cases/';
    updateTestFile( testDir + 'feedback_pass.json', passingDocs );
    updateTestFile( testDir + 'feedback_fail.json', failingDocs );
    db.close();
  });
}

updateTestFiles();
