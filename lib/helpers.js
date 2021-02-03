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

 module.exports = helpers;