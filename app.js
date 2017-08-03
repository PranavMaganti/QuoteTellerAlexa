'use strict';

console.log("start")

const alexaVerifier = require('alexa-verifier');
const firebase = require("firebase");
let express = require('express'),
    bodyParser = require('body-parser'),
    app = express();

var config = {
   apiKey: "AIzaSyCqUX77dqVfcrTyccb2BoMmwOXAvDSWMJk",
   authDomain: "inspirationalquotes-9c91d.firebaseapp.com",
   databaseURL: "https://inspirationalquotes-9c91d.firebaseio.com",
   projectId: "inspirationalquotes-9c91d",
   storageBucket: "inspirationalquotes-9c91d.appspot.com",
   messagingSenderId: "461152347598"
 };

firebase.initializeApp(config);
var database = firebase.database()

var PORT = process.env.PORT || 8080;

app.use(bodyParser.json({
    verify: function getRawBody(req, res, buf) {
        req.rawBody = buf.toString();
    }
}));

app.post('/quotes', requestVerifier, function(req, res){
  getQuote(function (quote){
    console.log(quote)
    res.json({
    "version": "1.0",
    "response": {
      "outputSpeech": {
        "type": "PlainText",
        "text": quote
    },
    "shouldEndSession": true
  }
    });
  });
})

app.listen(PORT);

function requestVerifier(req, res, next) {
    alexaVerifier(
        req.headers.signaturecertchainurl,
        req.headers.signature,
        req.rawBody,
        function verificationCallback(err) {
            if (err) {
                res.status(401).json({ message: 'Verification Failure', error: err });
            } else {
                next();
        }
      }
    );
}
function getQuote(callback){
  var path = "/quotes"
  var ref = database.ref(path)
  ref.on('value', gotData, errData)

  function gotData(data){
    var quotes = data.val()
    if (quotes === undefined) {
      return("There has been an error. Please try again Later")
    }
    else{
      let randomIndex = (Math.random()*(quotes.length-1)).toFixed();
      return (callback(quotes[randomIndex]))
      }
  }

  function errData(err){
    console.log("Error")
    console.log(err)
  }
}
