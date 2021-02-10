/**
 * Create and export configuration
 */

//Container for all the envairoments

let envairoments = {}

//Staging default eveniment
envairoments.staging = {
    'httpPort':3000,
    'httpsPort':3001,
    'envName':'staging',
    'hashingSecret':'thisIsASecretKey',
    "maxChecks":5,
    "twilio":{
        "accountSid":"ACb32d411ad7fe886aac54c665d25e5c5d",
        "authToken":"9455e3eb3109edc12e3d8c92768f7a67",
        'fromPhone':"+15005550006"
    }

};

//Production staging
envairoments.production = {
    'httpPort':5000,
    'httpsPort':5001,
    'envName':'production',
    'hashingSecret':'thisIsASecretKey',
    "maxChecks":5,
    "twilio":{
        "accountSid":"",
        "authToken":"",
        'fromPhone':""
    }
}

//Determinate which enviroment was passed as a comand-line argument
let currentEnvirment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current is one of the envoroment above,if not, default staging

let enviromentToExport = typeof(envairoments[currentEnvirment]) == 'object' ? envairoments[currentEnvirment] : envairoments.staging;

module.exports = enviromentToExport;