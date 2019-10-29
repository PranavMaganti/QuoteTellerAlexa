const Alexa = require('ask-sdk-core');
const movieQuotes = require('movie-quotes');
const famousQuotes = require('quotes-go');
const quoteOfTheDay = require("./quotes")
const { ExpressAdapter } = require('ask-sdk-express-adapter');


// Development environment - we are on our local node server
const express = require('express');
const app = express();
const firebase = require("firebase");



var PORT = process.env.PORT || 5000;

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
        if (Alexa.getRequestType(input.requestEnvelope) === 'IntentRequest') {
            return Alexa.getIntentName(input.requestEnvelope) === "QuoteIntent" 
            || Alexa.getIntentName(input.requestEnvelope) === "AMAZON.YesIntent";
        } else {
            return false
        }        
    },
    async handle(input) {
        let quoteType 
        const sessionAttributes = input.attributesManager.getSessionAttributes()
        if (Alexa.getIntentName(input.requestEnvelope) === "AMAZON.YesIntent") {
            quoteType = sessionAttributes.quoteType 
        } else {
            quoteType = lowerFirstLetter(Alexa.getSlotValue(input.requestEnvelope, "quoteType"))
        }

        sessionAttributes.quoteType = quoteType
        input.attributesManager.setSessionAttributes(sessionAttributes)

        
        var quote = await getQuote(quoteType) 
        let speech
        let heading
        if (quoteType == "quote of the day") {
            speech = quote + ". Would you like to hear another " + quoteType + "?"
            heading = capitaliseFirstLetter(quoteType)
        } else {
            speech = quote + ". Would you like to hear another " + quoteType + " quote?"
            heading = capitaliseFirstLetter(quoteType) + " Quote"
        }

        var repromptText = "You can ask for an inspirational quote, a movie quote, a famous quote or even the quote of the day."

        var res = input.responseBuilder
        .speak(speech)
        .withSimpleCard(heading, quote)
        .reprompt(repromptText)
        .getResponse()
        
        return res 
    }
}

const SessionEndedHandler = {
    canHandle(input) {
        return Alexa.getRequestType(input.requestEnvelope) === 'SessionEndedRequest' ||
        Alexa.getIntentName(input.requestEnvelope) === 'AMAZON.StopIntent';
    },
    handle(input) {
        return input.responseBuilder
            .speak("Thanks for using Quote Teller. Hope to see you again soon!")
            .withShouldEndSession(true)
            .getResponse();
    }
}

const LaunchHandler = {
    canHandle(input) {
        return Alexa.getRequestType(input.requestEnvelope) === 'LaunchRequest';
    },
    handle(input) {
        return input.responseBuilder
            .speak('Welcome to quote teller. You can ask for an inspirational quote, a movie quote, a famous quote or even the quote of the day.')
            .withShouldEndSession(false)
            .getResponse()
            
    }
}

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


function lowerFirstLetter(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
}

function capitaliseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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

const skillBuilder = Alexa.SkillBuilders.custom()
    .withSkillId("amzn1.ask.skill.c95db360-7a17-4118-99fa-6048917e8fda")
    .addRequestHandlers(
        QuoteHandler,
        LaunchHandler,
        SessionEndedHandler
    )
const skill = skillBuilder.create();
const adapter = new ExpressAdapter(skill, true, true);

app.post('/', adapter.getRequestHandlers())
app.listen(PORT)