var express = require('express');
var router = express.Router();

/* POST your feedback */
router.post('/', function(req, res, next) {
  
  // Set our internal DB variable
  var db = req.db;

  // Set our collection
  var collection = db.get('pelias');
  var doc = JSON.parse(req.query.log);

  doc.timestamp = (new Date()).toISOString();
  // Submit to the DB
  collection.insert(doc, function (err, doc) {
      if (err) {
          // If it failed, return error
          console.log(err);        
          res.send("There was a problem adding the information to the database.");
      }
      else {
          res.send({ success: true });
      }
  });
});

module.exports = router;