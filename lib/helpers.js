/**
 * Helpers for various tasks
 * 
 */
//Dependences
const crypto = require('crypto');
const config =require('../config');
const https = require('https');
const queryString = require('querystring');
 //Container for all the helpers
 let helpers={};

 //Create a SHA256 HASH
 helpers.hash = (str)=>{
    
    if(typeof(str) == 'string' && str.length > 0){
        let hash = crypto.createHmac('sha256',config.hashingSecret).update(str).digest('hex');
        return hash;
    }else{
        return false;
    }
 };

 //Parse a JSON string to a object in all cases without throw it
 helpers.parseJsonToObject = (str)=>{
    try{
        let obj = JSON.parse(str);
        return obj;
    }catch(e){
        return {};
    }
 }

//Create Random String alphanumeric characters
helpers.createRandomString = (stringlength)=>{
    stringlength = typeof(stringlength) == "number" && stringlength > 0 ? stringlength : false;
    if(stringlength){
        //Define all the posible characters that could go into a string
        let possibleCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789';
        //Start the final string
        let str = '';
        for(let i = 1; i <= stringlength; i++){
            //Get random characters from posibleCharacter
            let randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            //Append this character to the final string
            str += randomCharacter;
        }
        //Return Final String
        return str;

    }else{
        return false;
    }
}


//Sending SMS message using twilio
helpers.sendTwilioSms = (phone,msg,callBack)=>{
    //Validate parameters
    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <=  1600 ? msg.trim() : false;
     if(phone && msg){
        //Configur the request payload
        let payload = {
            'From':config.twilio.fromPhone,
            'To':'+1'+phone,
            'Body':msg
        }

        //Stringify the payload
        let stringifyPayload = queryString.stringify(payload);
        //Configure the request details
        let requestDetails = {
            'protocol':'https:',
            'hostname':'api.twilio.com',
            'method':'POST',
            'path':'/2020-04-01/Accounts/' + config.twilio.accountSid+'/Messages.json',
            'auth':config.twilio.accountSid+':'+config.twilio.authToken,
            'headers':{
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringifyPayload)
            }
        };

        //Instanciate the request obj by declare
        let req = https.request(requestDetails,(res)=>{
            //Grab the status of the sent request
            let status = res.statusCode;
            //Call Back successfuly if the request went throw
            if(status == 200 || status == 201){
                callBack(false);
            }else{
               callBack('Ststus code returned was '+ status); 
            }
        });

        //Bind to the error event so it dosen't get throw
        req.on('error',(e)=>{
            callBack(e);
        });

        //Add the request
        req.write(stringifyPayload);

        //End the request
        req.end();

     }else{
         callBack('Givin parameters were mising or invalid');
     }
}


 module.exports = helpers;