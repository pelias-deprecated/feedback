var fs = require( 'fs' );
var git = require( 'nodegit' );
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/pelias');

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

      testsJson.tests.push({
        id: 1,
        user: "feedback-app",
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

function updateTestFile( testFilePath ){
  var testsJson = JSON.parse(fs.readFileSync( testFilePath ));
  addTests( testsJson, function writeNewFile( newTestJson ){
    fs.writeFile( testFilePath, JSON.stringify( newTestJson, undefined, 2 ) );
  });
}

if( process.argv.length !== 3 ){
  console.error( 'Incorrect number of arguments.' );
  process.exit( 1 );
}
else {
  updateTestFile( process.argv[ 2 ] );
}
