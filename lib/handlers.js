/**
 * Request handlers
 */

 //Dependencies
 const  config  = require('../config');
const _data = require('./data');
 const helpers = require('./helpers');

//Define handlers
const handlers = {};


handlers.users =(data,callBack)=>{
  let accceptableMethods=['post','get','put','delete'];
  if(accceptableMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data,callBack);
  }else{
    callBack(405);
  }
};

//Container for the users submites
handlers._users = {};

/**
 * Required data: firstName,lastName,phone,password,tosAgrement
 * Optional data:none
 */
//users - post
handlers._users.post = (data,callBack)=>{
    //Check that all required fields are filled out
    let firstName = typeof(data.payload.firstName) == 'string' &&  data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false; 
    let lastName = typeof(data.payload.lastName) == 'string' &&  data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    let phone = typeof(data.payload.phone) == 'string' &&  data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    let password = typeof(data.payload.password) == 'string' &&  data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    let tosAgrement = typeof(data.payload.tosAgrement) == 'boolean' &&  data.payload.tosAgrement == true ? true : false;
   
    if(firstName && lastName && phone && password && tosAgrement){
        //Make sure that the user dosen't already exists
        _data.read('users',phone,(err,data)=>{
            if(err){
               //Hash the password
               let hashedPassword = helpers.hash(password);

               //Create User Object
               if(hashedPassword){
                    let userObject = {
                        'firstName':firstName,
                        'lastName':lastName,
                        'phone':phone,
                        'hashedPassword':hashedPassword,
                        'tosAgrement':true
                    }
                     //Store User
                    _data.create('users',phone,userObject,(err)=>{
                        if(!err){
                            callBack(200);
                        }else{
                            console.log(err);
                            callBack(500,{'Error':'Could not create the new user'});
                        }
                    });
                }else{
                    callBack(400,{'Error':'Could not hash the user\'s password'});
                }
              
            }else{
                //User aleready exist
                callBack(400,{'Error':'A user with that phone number already exists'});
            }
        });

    }else{
        callBack(400,{'Error' : 'Missing required field'});
    }

};

//users  - get
//Require data from:phone
//Optional data: none
//Onli let auth users acces they object

handlers._users.get = (data,callBack)=>{
    //Check if phone number is valid
    let phone = typeof(data.queryStringObject.phone) == "string" && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

    if(phone){
        //Get the token from the headers
        let token = typeof(data.headers.token) == "string" ? data.headers.token : false
        //Verifu that the given token from headers i valid from phone number
        handlers._tokens.verifyToken(token,phone,(tokenIsValid)=>{
            if(tokenIsValid){
                //lokup the user
                _data.read('users',phone,(err,data)=>{
                    if(!err && data){
                    // Remove the hashed password from the user object before returning it to the requester
                    delete data.hashedPassword;
                    callBack(200,data); 
                    }else{
                        callBack(404);
                    }
                });
            }else{
                callBack(403,{"Error":"Missing required token in header, or token is invalid"});
            }
        })
    }else{
        callBack(400,{"Error":"Missing required field"})
    }
};

//users - put
//Require data : phone
//Optional data: firstName,lastName,password(last speciofied);
handlers._users.put = (data,callBack)=>{
    //check for the required fields
    let phone = typeof(data.payload.phone) == "string" && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

    //Check for the optional fields
    let firstName = typeof(data.payload.firstName) == 'string' &&  data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false; 
    let lastName = typeof(data.payload.lastName) == 'string' &&  data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    let password = typeof(data.payload.password) == 'string' &&  data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    //Err is the phone is invalid
    if(phone){
        // iS NOT ERROR 
        if(firstName || lastName || password){
            //Get the token from the headers
            let token = typeof(data.headers.token) == "string" ? data.headers.token : false
            handlers._tokens.verifyToken(token,phone,(tokenIsValid)=>{
                if(tokenIsValid){
                      //Lockup the user 
                    _data.read('users',phone,(err,data)=>{
                        if(!err && data){
                            //Update fields
                            const userData ={};
                            if(firstName){
                                userData.firstName = firstName;
                            }
                            if(lastName){
                                userData.lastName = lastName;
                                userData.phone = phone;
                            }
                            if(password){
                                userData.hashedPassword = helpers.hash(password);
                            }
                            //Store the new update
                            _data.update('users',phone,userData,(err)=>{
                                if(!err){
                                    callBack(200);
                                    
                                }else{
                                callBack(500,{"Error":"Could not update the user"});  
                                }
                            });
                        }else{
                            callBack(400,{"Eror":"The specified user doses not exists"});
                        }
                    });

                }else{

                    callBack(403,{"Error":"Missing required token in header, pr token is invalid"});
                }
            });
        }else{
            callBack(400,{'Error':'Missing file to update'});
        }
    }else{
        callBack(400,{"Error":"Missing required field"});
    }
};

//users - delete
//Required File
// @TODO Onli let an authentificed users delete theyr account.Dont let them to delete anyone account
// @TODO Cleanup (delete) any other data sociated with this users
handlers._users.delete = (data,callBack)=>{
    //Check tat the phone number is valid
    let phone = typeof(data.queryStringObject.phone) == "string" && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if(phone){
        //Get the token from the headers
        let token = typeof(data.headers.token) == "string" ? data.headers.token : false
        handlers._tokens.verifyToken(token,phone,(tokenIsValid)=>{
            if(tokenIsValid){
                //lokup the user
                _data.read('users',phone,(err,userData)=>{
                
                    if(!err && data){
                    
                    _data.delete('users',phone,(err)=>{
                            if(!err){
                           
                               //If users was deleted succesfullty delete each checlk associated to users
                               let usersChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : []; 
                               let checksToDelete = usersChecks.length;
                               if(checksToDelete > 0){
                                 let checksDeleted =  0;
                                 let deletionErrors = false;
                                 //Loop throw the ckecks
                                 usersChecks.forEach(checkId => {
                                     //Delete the check 
                                     _data.delete('checks',checkId,(err)=>{
                                        if(err){
                                            deletionErrors = true;
                                        }
                                        checksDeleted ++;
                                        if(checksDeleted == checksToDelete){
                                            if(!deletionErrors){
                                                callBack(200)
                                            }else{
                                                callBack(500,{"Error":"Errors encauntered while attemting to dele all users checks or checks may not deleted succesfully"});
                                            }
                                        }
                                     });
                                 });

                               }else{
                                   callBack(200);
                               } 


                            }else{
                                callBack(500,{"Error":"Could not delete the specified user"})
                            }
                    });

                    }else{
                        callBack(400,{"Error":"Coud not find the specified user"});
                    }
            
                });
            }else{
                callBack(400,{"Eror":"The specified user doses not exists"});
            }
        });
    }else{
        callBack(400,{"Error":"Missing required field"})
    }
};

////////////////////////////////////////////////////////////////////////
//Tokens
handlers.tokens =(data,callBack)=>{
    let accceptableMethods=['post','get','put','delete'];
    if(accceptableMethods.indexOf(data.method) > -1){
          handlers._tokens[data.method](data,callBack);
    }else{
      callBack(405);
    }
  };


//Container for all tokens
handlers._tokens = {}

//Tokens posts
//Required data:phone, password
//Optional Data:none
handlers._tokens.post = (data,callBack)=>{
    let phone = typeof(data.payload.phone) == 'string' &&  data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    let password = typeof(data.payload.password) == 'string' &&  data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    console.log('dasasdsdad');
    if(phone && password){
      
        //Lookup the users who matches that phone number 
        _data.read('users',phone,(err,userData)=>{
            if(!err){
                //Hash the sent password,and compare with the password stored in the users object
                let hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.hashedPassword){
                    //if valid create a new token with a random name/set eperation 1h in future
                    let tokenId = helpers.createRandomString(20);
                    let expires = Date.now() + 1000 * 60 * 60;
                    let tokenObject = {
                        "phone":phone,
                        "id":tokenId,
                        "expires":expires
                    };
                    //Store token
                    _data.create('tokens',tokenId,tokenObject,(err)=>{
                        if(!err){
                          callBack(200,tokenObject);  
                        }else{
                            callBack(500,{"Error":"Could not create a new token"});
                        }
                    })
                }else{
                    callBack(400,{"Error":"Password did not match the specified user\s stored password"})
                }  
            }else{
                callBack(400,{"Error":"Could not find specified user"});
            }
        });
    }else{
        callBack(400,{"Error":"Missing required fields"});
        console.log('dasasdsdad');
    }
}

//Tokens get
//Required data:Id
//Optinlad data:none
handlers._tokens.get = (data,callBack)=>{
    //Check if the id is valid
        //Check if phone number is valid
        let id = typeof(data.queryStringObject.id) == "string" && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

        if(id){
            //lokup the token
            _data.read('tokens',id,(err,tokenData)=>{
                if(!err && tokenData){
                   callBack(200,tokenData); 
                }else{
                    callBack(404);
                }
            });
        }else{
            callBack(400,{"Error":"Missing required field"})
        }

}

//Tokens put
//Required Field:id,extend
//Optional data:nan
handlers._tokens.put = (data,callBack)=>{
    let id = typeof(data.payload.id) == 'string' &&  data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    let extend = typeof(data.payload.extend) == 'boolean' &&  data.payload.extend == true ? true : false;

    if(id && extend){
        //Lokup out the token
        _data.read('tokens',id,(err,tokenData)=>{
            if(!err && tokenData){
                //Check to the totken isen alerady active
                if(tokenData.expires > Date.now()){
                    // Set the expiraton an hours by now
                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    //Store the new updates
                    _data.update('tokens',id,tokenData,(err)=>{
                        if(!err){
                            callBack(200)
                        }else{
                            callBack(400,{"Error":"Could not update the token\'s expiration"})
                        }
                    });
                }else{
                    callBack(400,{"Error":"The token aleready expored and cannot be extended"});
                } 

            }else{
                callBack(400,{'Error':'Specified token dos not exist'});
            }
        })

    }else{
        callBack(400,{"Error":"Missing required fields or fields are invalid"});
    }
}

//Tokens delete
handlers._tokens.delete = (data,callBack)=>{
    //Check tat the phone number is valid
    let id = typeof(data.queryStringObject.id) == "string" && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id){
        //lokup the tokens
        _data.read('tokens',id,(err,data)=>{
           
            if(!err && data){
              
               _data.delete('tokens',id,(err)=>{
                    if(!err){
                      callBack(200)  
                    }else{
                        callBack(500,{"Error":"Could not delete the specified tokens"})
                    }
               });

            }else{
                callBack(400,{"Error":"Coud not find the specified tokens"});
            }
      
        });
    }else{
        callBack(400,{"Error":"Missing required field"})
    }
}

//Verify if a given id is curently valid from a given users
handlers._tokens.verifyToken = (id,phone,callBack)=>{
    //Loogup the token
    _data.read('tokens',id,(err,tokenData)=>{
        if(!err && tokenData){
            //Check if token if from give users and is not expired
            if(tokenData.phone == phone && tokenData.expires > Date.now()){
                callBack(true);
            }else{
                callBack(false);
            }
        }else{
            callBack(false);
        }
    })
}
//Checks

handlers.checks =(data,callBack)=>{
    let accceptableMethods=['post','get','put','delete'];
    if(accceptableMethods.indexOf(data.method) > -1){
          handlers._checks[data.method](data,callBack);
    }else{
      callBack(405);
    }
  }; 

//Container for the all checl methods
handlers._checks={};

//Checks  - post
//Required data:protocol,url,method,successCodes,timeoutSeconds
//Optional data:none
handlers._checks.post = (data,callBack)=>{
    //Validate inputs
    let protocol = typeof(data.payload.protocol) == 'string' &&  ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    let url = typeof(data.payload.url) == 'string' &&  data.payload.url.trim().length > 0 ? data.payload.url.trim() : false; 
    let method = typeof(data.payload.method) == 'string' &&  ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    let successCodes = typeof(data.payload.successCodes) == 'object' &&  data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0  ? data.payload.successCodes : false; 
    let timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' &&  data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false; 

    if(protocol && url && method && successCodes && timeoutSeconds){
        //Get The tokens from the headers
        let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    
        //Lookup the users by reading token
        _data.read('tokens',token,(err,tokenData)=>{
            if(!err && tokenData){
                let userPhone = tokenData.phone;
                //Lookup the user data
                _data.read('users',userPhone,(err,userData)=>{
                    if(!err && userData){
                        let usersChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                        //Verify that the users has last that max-checks-per-user
                        console.log(config.maxChecks)
                        if(usersChecks.length < config.maxChecks){
                            //Create a random id from the check
                            let checkId = helpers.createRandomString(20);
                            //Create the check object, and include the users phone
                            let checkObject = {
                                'id':checkId,
                                'userPhone':userPhone,
                                'protocol':protocol,
                                'url':url,
                                'method':method,
                                'successCodes':successCodes,
                                'timeoutSeconds':timeoutSeconds
                            }

                            //Save
                            _data.create('checks',checkId,checkObject,(err)=>{
                                if(!err){
                                    //Add the check id to the users object
                                    userData.checks = usersChecks;
                                    userData.checks.push(checkId);

                                    //Save the ne users data
                                    _data.update('users',userPhone,userData,(err)=>{
                                        if(!err){
                                            //Return data avout the new check
                                            callBack(200,checkObject);
                                        }else{
                                            callBack(500,{"Error":"Could not update the users with the new check"});
                                        }
                                    });
                                }else{
                                    callBack(400,{"Error":"Could not create the new check"});
                                }
                            });
                        }else{
                            callBack(400,{"Error":"User arelady has the maximum number o checks ("+config.maxChecks+")"});
                        }
                    }else{
                        callBack(403,{"Error":"Not Authorized"});
                    }
                });
            }else{
                callBack(403,{"Error":"Not Authorized"});
            }
        })
    }else{
        callBack(400,{"Error":"Missing required inputs,or inputs are invalid "+protocol + "-" + url + "-" + method + "-" + successCodes + "-" + timeoutSeconds+""});
    }
};

//Checks - get
//Required data:id
//Optional data: none
handlers._checks.get = (data,callBack)=>{
    //Check if id is valid
    let id = typeof(data.queryStringObject.id) == "string" && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

    if(id){
        console.log(id)
        //Lookup the check
        _data.read('checks',id,(err,checkData)=>{
            if(!err && checkData){
                
                //Get the token from the headers
                let token = typeof(data.headers.token) == "string" ? data.headers.token : false
                //Verifu that the given token from headers is valid and belongs to the checks
               
                handlers._tokens.verifyToken(token,checkData.userPhone,(tokenIsValid)=>{
                    if(tokenIsValid){
                        //If token is valid return the check data 
                        callBack(200,checkData);
                       
                    }else{
                        callBack(403);
                    }
                });



            }else{
                callBack(404);
            }
        });
    }else{
        callBack(400,{"Error":"Missing required field"})
    }
};

//Checks - put
//Required Data Id
//Optional Data: protocol,url,method,successCodes,timeoutSeconds
handlers._checks.put = (data,callBack)=>{
    
    //check for the required fields
    let id = typeof(data.payload.id) == "string" && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    let protocol = typeof(data.payload.protocol) == 'string' &&  ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    let url = typeof(data.payload.url) == 'string' &&  data.payload.url.trim().length > 0 ? data.payload.url.trim() : false; 
    let method = typeof(data.payload.method) == 'string' &&  ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    let successCodes = typeof(data.payload.successCodes) == 'object' &&  data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0  ? data.payload.successCodes : false; 
    let timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' &&  data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false; 
   
    //Check to make sure id is valid
    if(id){
            //Check if make sure on ore more optional has correct
            if(protocol || url || method || successCodes || timeoutSeconds){
               
                //Lookup the check
                _data.read('checks',id,(err,checkData)=>{
                    
                    if(!err && checkData){
                        let token = typeof(data.headers.token) == "string" ? data.headers.token : false

                        handlers._tokens.verifyToken(token,checkData.userPhone,(tokenIsValid)=>{
                            if(tokenIsValid){
                                //Update the check where is necessary
                                if(protocol){
                                    checkData.protocol = protocol;
                                }
                                if(url){
                                    checkData.url = url;
                                }
                                if(method){
                                    checkData.method = method;
                                }
                                if(successCodes){
                                    checkData.successCodes = successCodes;
                                }
                                if(timeoutSeconds){
                                    checkData.timeoutSeconds = timeoutSeconds;
                                }
                               
                                //Store the new updates
                                _data.update('checks',id,checkData,(err)=>{
                                    if(!err){
                                        callBack(200);
                                    }else{
                                        callBack(500,{"Error":"Could not update the check"});
                                    }
                                });
                            }else{
                                callBack(403);
                            }
                        });

                    }else{
                        callBack(400,{"Error":"Check id did not exists"});
                    }
                })
            }else{
                callBack(400,{"Error":"Missing fields to update"});
            }

    }else{
        callBack(400,{"Error":"Missing required fields"});
    }
}

//Checks - delete
//Required data: id
//Optional data:none
handlers._checks.delete = (data,callBack)=>{
    //Check tat the phone number is valid
    let id = typeof(data.queryStringObject.id) == "string" && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    
    if(id){

        //Loogup the checks
        _data.read('checks',id,(err,checkData)=>{
            if(!err && checkData){

                let token = typeof(data.headers.token) == "string" ? data.headers.token : false

                handlers._tokens.verifyToken(token,checkData.userPhone,(tokenIsValid)=>{
                    if(tokenIsValid){
                      
                       //Delete  check data
                        _data.delete('checks',id,(err)=>{
                            if(!err){

                                _data.read('users',checkData.userPhone,(err,userData)=>{
                        
                                    if(!err && userData){
                                    
                                        let usersChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];    
                                        
                                        //Remove the delete check from their list of checks
                                        let checkPosition = usersChecks.indexOf(id);

                                        if(checkPosition > -1){

                                            usersChecks.splice(checkPosition,1);
                                            //Resave the users data
                                            _data.update('users',checkData.userPhone,userData,(err)=>{
                                                if(!err){
                                                callBack(200)  
                                                }else{
                                                    callBack(500,{"Error":"Could not update the user"})
                                                }
                                             });

                                        }else{
                                            callBack(500,{"Error":"Could not find the check on the users object,so could not removed"})
                                        }
                
                                    }else{
                                        callBack(500,{"Error":"Coud not find the  user who created the check,coud not delete the ckech from the check list"});
                                    }
                            
                                });


                            }else{
                                callBack(500,{"Error":"Could not delete the check data"}) 
                            }
                        })

                    }else{
                        callBack(403);
                    }
                });


            }else{
                callBack(400,{"Error":"The specified check ID dose not exists"});
            }
        });

    }else{
        callBack(400,{"Error":"Missing required field"})
    }
};


//sample handler
handlers.ping = (data,callback)=>{
 //callbacka http status code and a payload object
 callback(200);
};

//not found handler
handlers.notFound = (data,callback)=>{
    callback(404);
};

module.exports = handlers;