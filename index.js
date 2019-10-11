const Alexa = require('ask-sdk-core');
Alexa.appid
let skill;

// Development environment - we are on our local node server
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const firebase = require("firebase");

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


const QuoteHandler = {
    canHandle(input) {
        return input.requestEnvelope.request.type === "InspirationalIntent";
    },
    handle(input) {
        console.log(input)
        getQuote(function (quote) {
            return input.responseBuilder
                .speak(quote)
                .withSimpleCard("Inspirational Quote", quote)
                .getResponse();
        })

    }
}

app.use(bodyParser.json());
app.post('/', function (req, res) {

    if (!skill) {
        skill = Alexa.SkillBuilders.custom()
            .withSkillId("amzn1.ask.skill.c95db360-7a17-4118-99fa-6048917e8fda")
            .addRequestHandlers(
                QuoteHandler
            )
            .create();
    }

    skill.invoke(req.body)
        .then(function (responseBody) {
            res.json(responseBody);
        })
        .catch(function (error) {
            console.log(error);
            res.status(500).send('Error during the request');
        });
});

function getQuote(callback) {
    var path = "/quotes"
    var ref = database.ref(path)
    ref.on('value', gotData, errData)

    function gotData(data) {
        var quotes = data.val()
        if (quotes === undefined) {
            return ("There has been an error. Please try again Later")
        }
        else {
            let randomIndex = (Math.random() * (quotes.length - 1)).toFixed();
            return (callback(quotes[randomIndex]))
        }
    }

    function errData(err) {
        console.log("Error")
        console.log(err)
    }
}

