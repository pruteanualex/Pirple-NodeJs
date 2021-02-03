/**
 * 
 * Primary file for the api
 * 
 */
//Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
//Encripted server
const fs = require('fs');
const _data = require('./lib/data');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');


//Testing
// _data.delete('test','newFile',(err)=>{
//     console.log('this was the error',err);
// });

//The server should response to all requiest with a string
const httpServer = http.createServer((req,res)=>{
    unifiedServer(req,res);
});
//Server listen on port 
httpServer.listen(config.httpPort,()=>{
    console.log('Server connected on port '+ config.httpPort +' in ' + config.envName + ' mode');
});

//Initialize https server
const httpsServerOptions = {
        'key': fs.readFileSync('./https/key.pem'),
        'cert':fs.readFileSync('./https/cert.pem')
}

const httpsServer = https.createServer(httpsServerOptions,(req,res)=>{
    unifiedServer(req,res);
});
//Start https server
httpsServer.listen(config.httpsPort,()=>{
    console.log('Server connected on port '+ config.httpsPort +' in ' + config.envName + ' mode');
});

//All the server logic,both http and https server
let unifiedServer = (req,res)=>{
      //  Get URL and parese it
      const parsedUrl = url.parse(req.url,true);
    
      //  Get the path
      const path = parsedUrl.pathname;
      const trimmedPath = path.replace(/^\/+|\/+$/g,'');
      
      // Get the query string as an object
      const queryStingObject = parsedUrl.query;
  
      //Get the http method
      const method = req.method.toLowerCase();
  
      //Get the headers as an object
      let headers = req.headers;
      //Get payload, if any
      const decoder = new stringDecoder('utf-8');
      let buffer = '';
      req.on('data',(data)=>{
          buffer += decoder.write(data);
      });
      req.on('end',()=>{
          buffer += decoder.end();
  
          //Choose the handler this request shpuld go if not found use not found
          let chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
          //Create data object to send to the handler
          let data = {
              'trimmedPath':trimmedPath,
              'queryStringObject':queryStingObject,
              'method':method,
              'headers':headers,
              'payload':helpers.parseJsonToObject(buffer)
          };
  
          //Route the request to the handel specify in the router
          chosenHandler(data,(statusCode,payload)=>{
              //use status code call back by the handler or defaultto 200
              statusCode = typeof(statusCode) == 'number' ? statusCode :200;
              //use the payload callBack by handler,or call an empty object
              payload = typeof(payload) == 'object' ? payload : {};
  
              //Convert the payload to a string
              let payloadString = JSON.stringify(payload);
  
              //return the respons
              //res.setHeader('Content-Type','application/json');
              res.writeHead(statusCode);
              res.end(payloadString);
              console.log('Rturning this response',statusCode,payloadString);
          });
          //  Send Response
         // res.end('Hello world\n');
          // Log the request path
          console.log('Request recive this payload - ',buffer );
          
      });
}



//Define router
const router ={
    'ping':handlers.ping,
    'users':handlers.users,
    'tokens':handlers.tokens
}




