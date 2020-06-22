import * as Alexa from 'ask-sdk-core';
import * as movieQuotes from 'movie-quotes';
import * as famousQuotes from 'quotes-go';
import {ExpressAdapter} from 'ask-sdk-express-adapter';
import * as firebase from 'firebase';
import express from 'express';
import {quoteOfTheDay, Quote} from './quotes';

const app = express();

const PORT = process.env.PORT || 5000;

const config = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  databaseURL: process.env.databaseURL,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
};


firebase.initializeApp(config);
const database = firebase.database();


const QuoteHandler: Alexa.RequestHandler = {
  canHandle(input: Alexa.HandlerInput):boolean {
    if (Alexa.getRequestType(input.requestEnvelope) === 'IntentRequest') {
      return Alexa.getIntentName(input.requestEnvelope) === 'QuoteIntent' ||
            Alexa.getIntentName(input.requestEnvelope) === 'AMAZON.YesIntent';
    } else {
      return false;
    }
  },
  async handle(input: Alexa.HandlerInput): Promise<Alexa.ResponseFactory> {
    let quoteType: string;
    const sessionAttributes = input.attributesManager.getSessionAttributes();
    if (Alexa.getIntentName(input.requestEnvelope) === 'AMAZON.YesIntent') {
      quoteType = sessionAttributes.quoteType;
    } else {
      const tempQt = Alexa.getSlotValue(input.requestEnvelope, 'quoteType');
      quoteType = lowerFirstLetter(tempQt);
    }

    sessionAttributes.quoteType = quoteType;
    input.attributesManager.setSessionAttributes(sessionAttributes);


    const quote = await getQuote(quoteType);
    let speech: string;
    let heading: string;
    if (quoteType == 'quote of the day') {
      speech = quote + '. Would you like to hear another ' + quoteType + '?';
      heading = capitaliseFirstLetter(quoteType);
    } else {
      speech = quote + '. Would you like to hear another ' +
        quoteType + ' quote?';
      heading = capitaliseFirstLetter(quoteType) + ' Quote';
    }

    const repromptText = `You can ask for an inspirational quote, a movie 
      quote, a famous quote or even the quote of the day.`;

    const res = input.responseBuilder
        .speak(speech)
        .withSimpleCard(heading, quote)
        .reprompt(repromptText)
        .getResponse();

    return res;
  },
};

const SessionEndedHandler: Alexa.RequestHandler = {
  canHandle(input: Alexa.HandlerInput): boolean {
    const reqType = Alexa.getRequestType(input.requestEnvelope);
    const intentName = Alexa.getIntentName(input.requestEnvelope);
    return reqType === 'SessionEndedRequest' ||
      intentName === 'AMAZON.StopIntent' ||
      intentName === 'AMAZON.NoIntent';
  },
  handle(input: Alexa.HandlerInput): Alexa.ResponseFactory {
    return input.responseBuilder
        .speak('Thanks for using Quote Teller. Hope to see you again soon!')
        .withShouldEndSession(true)
        .getResponse();
  },
};

const LaunchHandler: Alexa.RequestHandler = {
  canHandle(input: Alexa.HandlerInput): boolean {
    return Alexa.getRequestType(input.requestEnvelope) === 'LaunchRequest';
  },
  handle(input: Alexa.HandlerInput): Alexa.ResponseFactory {
    return input.responseBuilder
        .speak(`Welcome to quote teller. You can ask for an inspirational 
        quote, a movie quote, a famous quote or even the quote of the day.`)
        .withShouldEndSession(false)
        .getResponse();
  },
};

/**
 * Gets a random inspirational quote from the firebase database
 *
 * @return {Promise<string>} random inspirational quote
*/
async function getInspirationalQuote(): Promise<string> {
  const path = '/quotes';
  const ref = database.ref(path);
  const quote = ref.once('value').then(
      function(rawQuotes) {
        const quotes = rawQuotes.val();
        const randomIndex = (Math.random()*(quotes.length-1)).toFixed();
        return Promise.resolve(quotes[randomIndex]);
      },
      function() {
        const err = 'An error has occured. Please try again later.';
        return Promise.reject(new Error(err));
      },
  );

  return await quote;
}

/**
 * Changes first letter of a string to lower case
 *
 * @param {string} str the input string
 * @return {string} input string with first letter lower case
*/
function lowerFirstLetter(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * Capitilises the first letter of a string
 *
 * @param {string} str  the input string
 * @return {string} input string with capitalised first letter
*/
function capitaliseFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Fetches a random quote of a given quote type
 *
 * @param {string} quoteType the type of the quote to be fetched
 * @return {Promise<string>} a random quote
*/
async function getQuote(quoteType: string): Promise<string> {
  const quote = ( async function(quoteType) {
    switch (quoteType) {
      case 'inspirational':
        return await getInspirationalQuote();
      case 'movie':
        return addHyphen(movieQuotes.random());
      case 'famous': {
        const rawQuote = famousQuotes.getRandomQuote();
        return '"' + rawQuote.text + '" - ' + rawQuote.author.name;
      }
      case 'quote of the day': {
        const quote: Quote = await quoteOfTheDay();
        return '"' + quote.body + '" - ' + quote.author;
      }
      default:
        return 'No such quote was found. Please try again later.';
    }
  })(quoteType);

  return quote;
}

/**
 * Adds a hyphen between the quote and the person in a movie quote
 *
 * @param {string} quote a movie quote
 * @return {Promise<string>} the modified quote with a hyphen
*/
function addHyphen(quote: string): string {
  const indexOfQ = quote.indexOf('"', 1);
  const person = quote.slice(indexOfQ+1);
  const text = quote.slice(0, indexOfQ+1);
  const newQuote = text + ' -' + person;
  return newQuote;
}

const skillBuilder = Alexa.SkillBuilders.custom()
    .withSkillId('amzn1.ask.skill.c95db360-7a17-4118-99fa-6048917e8fda')
    .addRequestHandlers(
        QuoteHandler,
        LaunchHandler,
        SessionEndedHandler,
    );
const skill = skillBuilder.create();
const adapter = new ExpressAdapter(skill, true, true);

app.post('/', adapter.getRequestHandlers());
app.listen(PORT);
