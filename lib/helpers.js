/**
 * Helpers for various tasks
 * 
 */
//Dependences
const crypto = require('crypto');
const config =require('../config');
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


 module.exports = helpers;