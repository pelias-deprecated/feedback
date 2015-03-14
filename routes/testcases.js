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
      } 
      doc.found_in_pelias = doc.found && !doc.nominatum_results;
      doc.found_in_nominatum = doc.found && doc.nominatum_results && doc.nominatum_results.length>0;

      if (!doc.found_in_pelias && doc.found_in_nominatum) {
        doc.classname = 'danger';
      } 

      if (doc.found_in_pelias) {
        doc.selected.map(function(d) {
          var id = d.properties.id;
          doc.results.forEach(function(dd, index){
            if (dd.properties.id === id) {
              doc.selected_index = doc.selected_index ? Math.min(doc.selected_index,index) : index;
            }
          });
        });
        
        if(doc.selected_index>=0 && doc.selected_index<3) {
          // if found in pelias and is the top 3 result
          doc.classname = 'success';  
        } else {
          // if found in pelias and is not in the top 3
          doc.classname = 'warning';
        }
      }

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
