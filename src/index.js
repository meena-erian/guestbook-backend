var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";
var express = require("express");
var cookieParser = require("cookie-parser");
var app = express();
var fs = require("fs");

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  dbo = db.db("guestbookdb");

  app.get("/test", function(req, res) {
    res.setHeader("Content-Type", "application/json");
    let dateo = new Date();
    dbo.collection("visits")
       .insertOne({ time: dateo.getSeconds() }, function(err, res) {
         if (err) throw err;
      }
    );
    var visits = dbo
      .collection("visits")
      .find()
      .toArray(function(err, arr) {
        res.end(JSON.stringify(arr));
      });
  });

  var server = app.listen(8080, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log("API is running at http://" + host + ":" + port);
  });
});
