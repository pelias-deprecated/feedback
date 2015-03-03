var express = require('express');
var router = express.Router();

/* GET feedback index page. */
router.get('/', function(req, res) {
  var db = req.db;
  var collection = db.get('pelias');
  collection.find({},{limit: 30, sort: {timestamp: -1}},function(e,docs){
    docs = docs.map(function(doc) {
      if (!doc.found) {
        doc.classname = 'danger';
      } else {
        doc.classname = !doc.nominatum_results ? 'success' : (doc.nominatum_results.length>0 ? 'warning' : 'danger');  
      }
      doc.found_in_pelias = doc.found && !doc.nominatum_results;
      doc.found_in_nominatum = doc.found && doc.nominatum_results && doc.nominatum_results.length>0;
      if (doc.found_in_nominatum === undefined) {
        doc.found_in_nominatum = '-';
      }
      if (doc.selected) {
        doc.selected.map(function(sel) {
          sel.doc_text = sel.properties ? sel.properties.text : sel.display_name; 
        });
      }
      return doc;
    });

    res.render('testcases', {
        "testcases" : docs
    });
  });
});

module.exports = router;
