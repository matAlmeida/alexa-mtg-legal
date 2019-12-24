// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const axios = require('axios');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello! Which card do you want to know if is legal or not in Magic: The Gathering?';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CardLegalityIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CardLegalityIntent';
    },
    async handle(handlerInput) {
        const cardname = handlerInput.requestEnvelope.request.intent.slots.cardname.value;
        const gameformat = handlerInput.requestEnvelope.request.intent.slots.gameformat.value;
        
        const response = await axios.get(`https://api.scryfall.com/cards/named?fuzzy=${cardname}`);
        
        const cardData = await response.data;
        
        let speakOutput = '';
        
        if(cardData.object === 'error') {
            speakOutput = cardData.details
        } else if(cardData.object === 'card') {
            const { legalities } = cardData;
            
            if(gameformat) {
                const l = legalities[gameformat].replace('_', ' ');
                
                speakOutput = `${cardData.name} is ${l} in ${gameformat}`;
            } else {
                const legalIn = [];
                const notLegalIn = [];
                const restrictedIn = [];
                const bannedIn = [];
                
                Object.keys(legalities).map((gformat) => {
                    switch(legalities[gformat]) {
                        case 'legal':
                            legalIn.push(gformat);
                            break;
                        case 'not_legal':
                            notLegalIn.push(gformat);
                            break;
                        case 'restricted':
                            restrictedIn.push(gformat);
                            break;
                        case 'banned':
                            bannedIn.push(gformat);
                            break;
                        default:
                            break;
                    }
                })
                
                const reduceArray2Text = (farray) => (text, format, idx) => {
                    let nText = text + format
                    
                    if(idx < farray.length - 2) {
                        nText += ', '
                    } else if (idx < farray.length - 1) {
                        nText += ' and '
                    } else {
                        nText += '.'
                    }
                    
                    return nText
                }
                
                const legalText = legalIn.reduce(reduceArray2Text(legalIn), 'Is legal in ')
                const notLegalText = notLegalIn.reduce(reduceArray2Text(notLegalIn), 'Is not legal in ')
                const restrictedText = restrictedIn.reduce(reduceArray2Text(restrictedIn), 'Is restricted in ')
                const bannedText = bannedIn.reduce(reduceArray2Text(bannedIn), 'Is banned in ')
                
                speakOutput += `${cardData.name} `;
                if(legalIn.length) speakOutput += legalText + ' ';
                if(bannedIn.length) speakOutput += bannedText + ' ';
                if(restrictedIn.length) speakOutput += restrictedText + ' ';
                if(notLegalIn.length) speakOutput += notLegalText + ' ';
            }
        }
        
        const repromptOutput = 'Any more card you want to know about?'
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptOutput)
            .getResponse();
    }
};
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can ask if a Magic card is legal in any format! You can ask only the card name then I\'ll tell you that card state in all formats. Or the card and a specifc format';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        CardLegalityIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda();

