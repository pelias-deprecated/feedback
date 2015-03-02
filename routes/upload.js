var express = require('express');
var router = express.Router();
var fs = require("fs");

/* POST your feedback */
router.post('/', function(req, res, next) {
  fs.appendFile( "log.json", '\n'+JSON.stringify( req.query.log ), "utf8", function(){
    res.send({ success: true });
  });  
});

module.exports = router;