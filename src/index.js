var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";
var express = require("express");
var md5 = require('md5');
var uniqid = require('uniqid');
var cookieParser = require("cookie-parser");
var app = express();
//var fs = require("fs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
let validUsername = /^[a-zA-Z0-9]{5,30}$/;

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  dbo = db.db("guestbookdb");
  app.get("/user/:username", function(req, res){

    req.params.username
  });
  app.post("/user/login", function(req, res) {
    res.setHeader("Content-Type", "application/json");
    if(!req.body.username || !req.body.password || !validUsername.test(req.body.username)){
      res.status(401).end();
    }
    
    res.end(JSON.stringify({id : md5(uniqid())}));
  });

  var server = app.listen(8080, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log("API is running at http://" + host + ":" + port);
  });
});
