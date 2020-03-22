var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";
var express = require("express");
var md5 = require("md5");
var uniqid = require("uniqid");
var cookieParser = require("cookie-parser");
var app = express();
//var fs = require("fs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
let validUsername = /^[a-zA-Z0-9]{5,30}$/;

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  dbo = db.db("guestbookdb");

  app.get("/user/:username", function(req, res) {
    res.setHeader("Content-Type", "application/json");
    if (! validUsername.test(req.params.username)) {
      res.status(451).end();
    }
    dbo
      .collection("users")
      .findOne(
        { username: req.params.username},
        function(err, findRes) {
          if (err) throw err;
          if (findRes) {
            res.status(401).end();
          } else {
            res.status(204).end();
          }
        }
      );
  });

  app.post("/user/login", function(req, res) {
    res.setHeader("Content-Type", "application/json");
    if (
      !req.body.username ||
      !req.body.password ||
      !validUsername.test(req.body.username)
    ) {
      res.status(401).end();
    }
    dbo
      .collection("users")
      .findOne(
        { username: req.body.username, password: req.body.password },
        function(err, findRes) {
          if (err) throw err;
          if (findRes) {
            let sid = md5(uniqid());
            dbo.collection("sessions").insertOne(
              {
                sessionId: sid,
                username: req.body.username,
                userId: findRes._id,
                start: new Date().getTime()
              },
              function(err, sessionInsertRes) {
                if (err) throw err;
                res.status(200).end(JSON.stringify({ id: sid }));
              }
            );
          } else {
            res.status(401).end();
          }
        }
      );
  });

  app.post("/user/signup", function(req, res) {
    res.setHeader("Content-Type", "application/json");
    if (
      !req.body.username ||
      !req.body.password ||
      !validUsername.test(req.body.username)
    ) {
      res.status(401).end();
    }
    dbo
      .collection("users")
      .findOne(
        { username: req.body.username, password: req.body.password },
        { username: true },
        function(err, findRes) {
          if (err) throw err;
          if (findRes) {
            res.status(451).end('{ "error" : "Username already in use" }');
            console.log(findRes);
          } else {
            dbo.collection("users").insertOne(
              {
                username: req.body.username,
                password: req.body.password,
                registered: new Date().getTime()
              },
              function(err, InsertRes) {
                if (err) {
                  throw err;
                } else {
                  let sid = md5(uniqid());
                  dbo.collection("sessions").insertOne({
                    sessionId: sid,
                    username: req.body.username,
                    userId: InsertRes._id,
                    start: new Date().getTime()
                  },function (err, sessionInsertRes){
                    if (err) throw err;
                    res.status(200).end(JSON.stringify({ id: sid }));
                  });
                }
              }
            );
          }
        }
      );
  });

  var server = app.listen(8080, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log("API is running at http://" + host + ":" + port);
  });
});
