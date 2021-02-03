/*
*
* Library for storing and editing data 
*
*/

const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

//Container for this module
const lib={}

//Base directory the data folder
lib.baseDir = path.join(__dirname,'/../data/');


//Write data to a file --Express js-- param.create(value)
lib.create = (dir,file,data,callBack)=>{
    //Open the file for writting
    fs.open(lib.baseDir+dir+'/'+file+'.json','wx',(err,fileDescriptor)=>{
        if(!err && fileDescriptor){
            //Convert data to string
            const stringData = JSON.stringify(data);
            //write file amd close
            fs.writeFile(fileDescriptor,stringData,(err)=>{
                if(!err){
                    fs.close(fileDescriptor,(err)=>{
                        if(!err){
                            callBack(false);
                        }else{
                            callBack('Error closing new file.')
                        }
                    })
                }else{
                    callBack('Err writing a new file')
                }
            });
        }else{
            callBack('Coud not create new file,it may alerady exists');
        }
    });
}

//Read data from a file --Express js-- param.find(value)
// lib.read = (dir,file,callBack)=>{
//     fs.readFile(lib.baseDir+dir+'/'+file+'.json','utf-8',(err,data)=>{
//         callBack(err,data);
//     });
// }
lib.read = (dir,file,callBack)=>{
    fs.readFile(lib.baseDir+dir+'/'+file+'.json','utf-8',(err,data)=>{
        if(!err && data){
            let parseData = helpers.parseJsonToObject(data);
            callBack(false,parseData)
        }else{
            callBack(err,data);
        }
    });
}


//Update an existing file --Express js-- param.patch(value)
lib.update = (dir,file,data,callBack)=>{
    //Open file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json','r+',(err,fileDescriptor)=>{
        if(!err && fileDescriptor){
            //Convert data to a string
            const stringData = JSON.stringify(data);
            //Trucate the file
            fs.truncate(fileDescriptor,(err)=>{
                if(!err){
                    //Write the file and close it
                    fs.writeFile(fileDescriptor,stringData,(err)=>{
                        if(!err){
                            fs.close(fileDescriptor,(err)=>{
                                if(!err){
                                    callBack(false)
                                }else{
                                   callBack('There was an error closing the file'); 
                                }
                            });
                        }else{
                           callBack('Error writing an existing file'); 
                        }
                    });
                }else{
                    callBack('Error trucating file')
                }
            });
        }else{
            callBack('Coud not open the file for updating,it many not exists yet');
        }
    });
}

//Delete a file 
lib.delete = (dir,file,callBack)=>{
    //Unlink the file 
    fs.unlink(lib.baseDir+dir+'/'+file+'.json',(err)=>{
        if(!err){
            callBack(false)
        }else{
            callBack('Error deleting file');
        }
    });
}

module.exports = lib;