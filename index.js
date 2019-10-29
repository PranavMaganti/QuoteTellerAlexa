const Alexa = require('ask-sdk-core');
const movieQuotes = require('movie-quotes');
const famousQuotes = require('quotes-go');
const quoteOfTheDay = require("./quotes")


Alexa.appid
let skill;

// Development environment - we are on our local node server
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const firebase = require("firebase");

var PORT = 5000;

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
        return Alexa.getRequestType(input.requestEnvelope) === 'IntentRequest' ||
        Alexa.getIntentName(input.requestEnvelope) === "QuoteIntent" 
        || Alexa.getIntentName(input.requestEnvelope) === "AMAZON.YesIntent";
    },
    async handle(input) {
        let quoteType 
        const sessionAttributes = input.attributesManager.getSessionAttributes()
        if (Alexa.getIntentName(input.requestEnvelope) === "AMAZON.YesIntent") {
            quoteType = sessionAttributes.quoteType 
        } else {
            quoteType = capitaliseFirstLetter(Alexa.getSlotValue(input.requestEnvelope, "quoteType"))
        }

        sessionAttributes.quoteType = quoteType
        input.attributesManager.setSessionAttributes(sessionAttributes)

        
        var quote = await getQuote(quoteType) 
        if (quoteType == "quote of the day") {
            quote += ". Would you like to hear another " + quoteType + "."
        } else {
            quote += ". Would you like to hear another " + quoteType + " quote."
        }

        var heading = quoteType + " Quote"
        var repromptText = "You can ask for an inspirational quote, a movie quote, a famous quote or even the quote of the day."

        var res = input.responseBuilder
        .speak(quote)
        .withSimpleCard(heading, quote)
        .reprompt(repromptText)
        .getResponse()
        
        return res 
    }
}

const SessionEndedHandler = {
    canHandle(input) {
        return Alexa.getRequestType(input.requestEnvelope) === 'SessionEndedRequest' ||
        Alexa.getRequestType(input.requestEnvelope) === 'AMAZON.StopIntent';
    },
    handle(input) {
        return input.responseBuilder
            .speak("Thanks for using Quote Teller. Hope to see you again soon!")
            .getResponse();
    }
}

app.use(bodyParser.json());
app.post('/', function (req, res) {
    if (!skill) {
        skill = Alexa.SkillBuilders.custom()
            .withSkillId("amzn1.ask.skill.c95db360-7a17-4118-99fa-6048917e8fda")
            .addRequestHandlers(
                QuoteHandler,
                SessionEndedHandler
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


async function getInspirationalQuote() {
    var path = "/quotes"
    var ref = database.ref(path)
    var quote = ref.once('value').then(
        function (rawQuotes) {
            var quotes = rawQuotes.val()
            let randomIndex = (Math.random()*(quotes.length-1)).toFixed();
            return Promise.resolve(quotes[randomIndex])
        },
        function () {
            return Promise.reject("An error has occured. Please try again later.")
        }
    )

    return await quote
        
}

app.listen(PORT)

function capitaliseFirstLetter(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
}

async function getQuote(quoteType) {
    var quote = ""
    if (quoteType == "inspirational") {
        quote = await getInspirationalQuote() 
    } else if (quoteType == "movie") {
        quote = addHyphen(movieQuotes.random())
    } else if (quoteType == "famous") {
        var rawQuote = famousQuotes.getRandomQuote()
        quote = '"' + rawQuote.text + '" - ' +  rawQuote.author.name
    }  else if (quoteType == "quote of the day") {
        var values = await getQuoteOfTheDay()
        var rawQuote = values[0]
        var author = values[1]
        quote = '"' + rawQuote + '" - ' + author
    } else {
        quote = "No such quote was found. Please try again later."
    }

    return quote
}

function addHyphen(quote) {
    var indexOfQ = quote.indexOf('"', 1);
    var person = quote.slice(indexOfQ+1)
    var text = quote.slice(0,indexOfQ+1)
    var newQuote = text + " -" + person
    return newQuote

}

async function getQuoteOfTheDay() {
    var quote = await quoteOfTheDay()
    return [quote.quote.body, quote.quote.author]
}

