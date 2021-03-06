var MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectID;
var url = "mongodb://localhost:27017/";
var express = require("express");
var md5 = require("md5");
var uniqid = require("uniqid");
//var cookieParser = require("cookie-parser");
var app = express();
//var fs = require("fs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
/*
  Note: The following CORS policy is a temporary setting for beta testing and
    Should not be applied a production version. A specific origin has to be 
    specified rather than the astrisk "*" wildcard, or it would be even better
    if the api can be on a subdomain of the same domain hosting the front-end app
*/
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});
let validUsername = /^[a-zA-Z0-9]{5,30}$/;

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  dbo = db.db("guestbookdb");

  app.get("/user/:username", function(req, res) {
    res.setHeader("Content-Type", "application/json");
    if (!validUsername.test(req.params.username)) {
      res.status(451).end();
    }
    dbo
      .collection("users")
      .findOne({ username: req.params.username }, function(err, findRes) {
        if (err) throw err;
        if (findRes) {
          res.status(401).end();
        } else {
          res.status(204).end();
        }
      });
  });

  // To login to an account using username and password
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
                userId: String(findRes._id),
                start: new Date().getTime()
              },
              function(err, sessionInsertRes) {
                if (err) throw err;
                res.status(200).end(JSON.stringify({ "token": sid }));
              }
            );
          } else {
            res.status(401).end();
          }
        }
      );
  });

  // To craete a new account
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
              function(err, userInsertResult) {
                if (err) throw err;
                let sid = md5(uniqid());
                dbo.collection("sessions").insertOne(
                  {
                    sessionId: sid,
                    username: req.body.username,
                    userId: String(userInsertResult["insertedId"]),
                    start: new Date().getTime()
                  },
                  function(err, sessionInsertRes) {
                    if (err) throw err;
                    res.status(200).end(JSON.stringify({ "token": sid }));
                  }
                );
              }
            );
          }
        }
      );
  });

  // To update the client side with anything new
  app.get("/notification", async function(req, res) {
    res.setHeader("Content-Type", "application/json");
    if (!req.headers.authorization) {
      res.status(401).end();
    }
    var session = await dbo
      .collection("sessions")
      .findOne({ sessionId: req.headers.authorization });
    if (!session) {
      res.status(401).end();
    }
    var usersQuery = {};
    if (req.query.index) {
      if (isNaN(req.query.index)) {
        usersQuery = { _id: { $gt: ObjectId(req.query.index), $ne: ObjectId(session.userId) } };
      } else {
        usersQuery = { registered: { $gt: parseInt(req.query.index) }, _id: { $ne: ObjectId(session.userId)} };
      }
    }
    var users = await dbo
      .collection("users")
      .find(usersQuery, { sort: { registered: 1 }, fields: { password: 0 } });
    var messagesQuery = {}
    if(req.query.index && !isNaN(req.query.index)){
      messagesQuery = { receiver: String(session.userId), status: "sent", time : { $gt: parseInt(req.query.index) } };
    }
    else{
      messagesQuery = { receiver: String(session.userId), status: "sent" };
    }
    console.log(messagesQuery);
    var mesgs = await dbo.collection("messages").find(messagesQuery);
    var jsonResponse = {};
    var noResponse = true;
    if ((await users.count()) > 0) {
      jsonResponse["users"] = await users.toArray();
      noResponse = false;
    }
    if ((await mesgs.count()) > 0) {
      jsonResponse["messages"] = await mesgs.toArray();
      noResponse = false;
    }
    if (noResponse) {
      res.status(204).end();
    } else {
      res.status(200).end(JSON.stringify(jsonResponse));
    }
  });

  // To send a message
  app.post("/message/:id", async function(req, res) {
    res.setHeader("Content-Type", "application/json");
    if (!req.headers.authorization) {
      res.status(401).end();
    }
    var session = await dbo
      .collection("sessions")
      .findOne({ sessionId: req.headers.authorization });
    if (!session) {
      //sender must provid a valid login session
      res.status(401).end('{"error" : "Bad credentials!"}');
    }
    else if (!req.params.id) {
      //id parameter is required
      res.status(404).end('{"error" : "No recipient specified!"}');
    }
    else if (!req.body.content) {
      //Message body is required
      res.status(401).end('{"error" : "No content provided!"}');
    }
	else {
    var conversationId = "";
    var receiver = "";
    if (req.params.id.indexOf("-") !== -1) {
      //this means that the given id is a conversation id
      let chaters = req.params.id.split("-", 2);
      switch (session["userId"]) {
        case chaters[0]:
          receiver = chaters[1];
          break;
        case chaters[1]:
          receiver = chaters[0];
          break;
        default:
          res.status(404).end();
      }
      //Now lets make sure that the user specified as receiver exists
      userReceiver = await dbo
        .collection("users")
        .findOne({ _id: new ObjectId(receiver) });
      if (!userReceiver) {
        res
          .status(404)
          .end('{"error" : "User \'' + receiver + "' not found\"}");
      }
      //Now lets recreate the chat id for incase it's not in the correctorder
      conversationId = [String(session.userId), receiver].sort().join("-");
    } else {
      //this means that the fiven id is a user id of the user intended to recieve the message
      receiver = req.params.id;
      //Now lets make sure that the user specified as receiver exists
      userReceiver = await dbo
        .collection("users")
        .findOne({ _id: new ObjectId(receiver) });
      if (!userReceiver) {
        res
          .status(404)
          .end('{"error" : "User \'' + receiver + "' not found\"}");
      }
      conversationId = [String(session.userId), receiver].sort().join("-");
    }
    //Now it's safe to insert the message

    let NewMessage = {
      // _id auto
      chatId: conversationId,
      time: new Date().getTime(),
      sender: String(session.userId),
      senderName : session.username,
      receiver: receiver,
      content: req.body.content,
      status: "sent"
    };
    dbo.collection("messages").insertOne(
      NewMessage,
      function(err, insertMessageRes) {
        if (err) throw err;
        console.log(insertMessageRes);
        NewMessage._id = String(insertMessageRes["insertedId"]);
        res
          .status(200)
          .end(JSON.stringify(NewMessage));
      }
    );
  }});

  // To fetch messages of a chat
  app.get("/messages/:id", async function(req, res) {
    res.setHeader("Content-Type", "application/json");
    if (!req.headers.authorization) {
      res.status(401).end('{"error" : "Bad credentials!"}');
    }
    var session = await dbo
      .collection("sessions")
      .findOne({ sessionId: req.headers.authorization });
    if (!session || !req.params.id) {
      res.status(401).end('{"error" : "Missing \'id\' parameter!"}');
    }
    var chatId = [];
    if(req.params.id.indexOf("-") !== -1){
      chatId = req.params.id.split("-", 2);
    }
    else{
      chatId = [req.params.id, String(session.userId)].sort();
    }
    if (chatId.length !== 2) {
      res.status(401).end('{"error" : "Invalid \'id\' parameter!"}');
    }
    /* 
      First, lets make sure about 2 things:
        1- The authorized user is a member in the specified chat
        2- The other person exists in the database
    */
    var otherUser = "";
    switch (String(session["userId"])) {
      case chatId[0]:
        otherUser = chatId[1];
        break;
      case chatId[1]:
        otherUser = chatId[0];
        break;
      default:
        res.status(401).end('{"error" : "Access denied!"}');
    }
    //Now lets make sure the other user exists
    var idLookupResult = await dbo
      .collection("users")
      .findOne({ _id: new ObjectId(otherUser) });
    if (!idLookupResult) {
      res.status(404).end('{"error" : "User not found"}');
    }
    //Now everything is ok but we still don't know if there's any messages there
    var query = {};
    if (req.query.index) {
      query = {
        _id: { $gt: new ObjectId(req.query.index) },
        chatId: chatId.join("-")
      };
    } else {
      query = { chatId: chatId.join("-") };
    }
    var msgs = await dbo.collection("messages").find(query);
    if (!(await msgs.count())) {
      //No new messages
      res.status(204).end('{"messages" : []}');
    }
    msgs = await msgs.toArray();
    query.receiver = String(session.userId);
    await dbo.collection("messages").updateMany(query, 
      { $set: { status: "seen" } }
    );
    res.status(200).end(JSON.stringify(msgs));
  });

  // To edit a message
  app.patch("/message/:id", async function(req, res) {
    res.setHeader("Content-Type", "application/json");
    if (!req.headers.authorization) {
      res.status(401).end('{ error: "Bad credentials!" }');
    }
    var session = await dbo
      .collection("sessions")
      .findOne({ sessionId: req.headers.authorization });
    if (!session || !req.params.id) {
      res.status(401).end('{ error: "Bad credentials!" }');
    }
    //Now lets find the message and see if it belongs to the authorized user
    var msg = await dbo
      .collection("messages")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!msg) {
      res
        .status(404)
        .end('{"error" : "The message you\'r tring to edit does not exist"}');
    }
    if (!req.body.content || !req.body.content.length) {
      res.status(401).end('{"error" : "Content is missing!"}');
    }
    if (msg.sender !== String(session.userId)) {
      res
        .status(401)
        .end(
          '{"error" : "You do not have permission to edit the specified message!"}'
        );
    }
    console.log("Now we're going to update the document object");
    var editingDbResponse = await dbo
      .collection("messages")
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set : { content: req.body.content }},
        {upsert: true}
      );
    if (!editingDbResponse) {
      res
        .status(500)
        .end(
          '{"error" : "Somethng went wrong! Perhapes the message you where trying to edit was deleted by another session at the very moment you where trying to edit it"}'
        );
    }
    res.status(204).end();
  });

  // To delete a message
  app.delete("/message/:id", async function(req, res) {
    res.setHeader("Content-Type", "application/json");
    if (!req.headers.authorization) {
      res.status(401).end('{ "error": "Bad credentials!" }');
    }
    var session = await dbo
      .collection("sessions")
      .findOne({ sessionId: req.headers.authorization });
    if (!session || !req.params.id) {
      res.status(401).end('{ "error": "Bad credentials!!" }');
    }
    //Now lets find the message and see if it belongs to the authorized user
    var msg = await dbo
      .collection("messages")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!msg) {
      res.status(404).end('{"error" : "Message not found"}');
    }
    else if (msg.sender !== String(session.userId)) {
      res
        .status(401)
        .end(
          '{"error" : "You do not have permission to delete this message!"}'
        );
    }
    var deletingDbResponse = await dbo
      .collection("messages")
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (!deletingDbResponse) {
      res
        .status(500)
        .end(
          '{"error" : "Something went wrong! Maybe the message was already deleted by an another session at the same time"}'
        );
    }
    res.status(204).end();
  });

  var server = app.listen(8080, function() {
    var port = server.address().port;
    console.log("API is listening at port:" + port);
  });
});
