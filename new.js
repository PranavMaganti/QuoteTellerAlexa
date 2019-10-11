const Alexa = require("ask-sdk-core");
const Request = require("request-promise");


exports.handler = function(event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);

    alexa.appId = "amzn1.ask.skill.c95db360-7a17-4118-99fa-6048917e8fda" // APP_ID is your skill id which can be found in the Amazon developer console where you create the skill.
    alexa.registerHandlers(QuoteHandler);
    alexa.execute();
};

const QuoteHandler = {
    canHandle(input) {
        return input.requestEnvelope.request.type === "InspirationalIntent";
    },
    handle(input) {
        console.log(input)
        getQuote (function(quote) {
            return input.responseBuilder
            .speak(quote)
            .withSimpleCard("Inspirational Quote", quote)
            .getResponse();
        })
        
    }
}

const skill = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    QuoteHandler)
  .create();



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
