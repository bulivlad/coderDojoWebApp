/**
 * Created by Adin Paraschiv on 2/26/2017.
 */

let fs = require('fs'),
    keys = require('../static_keys/project_keys');

const DESPRE = "templating/templates/despre.json";

let readInfo = {};

readInfo.cache = {};

readInfo.initiate = function(){
    //Reading the Despre section
    readFile(DESPRE, keys.despre, watchForFileChanges);
};

// This method reads a file, and sets the content read from disk to the readInfo object. It it is called with a callback
// It calls that callback function. This is usually done to se a watcher for file changes
function readFile(nameOfFile, nameOfCategory, callback){
    console.log("LOGGING: readFile Entry");
    //LOGGING
    fs.readFile(nameOfFile, 'utf8', function(err, data){
        if (err){
            console.log("Error:", err);
            throw new Error(err);
        }
        let dataJson = JSON.parse(data);
        readInfo.cache[nameOfCategory] = dataJson;
        if (null != callback){
            callback(nameOfFile, nameOfCategory);
        }
    });
}

//This function watches for changes in the file, and if there is a change, it read the file again.
function watchForFileChanges(nameOfFile, nameOfCategory){
    fs.watch(nameOfFile, function(curr){
        //LOGGING
        console.log('LOGGING: Watch for file change');
        if (curr === 'change'){
            try {
                readFile(nameOfFile, nameOfCategory, null);
            }
            catch(err){
                //LOGGING
                console.log(err);
            }
        }
    })
}


module.exports = readInfo;