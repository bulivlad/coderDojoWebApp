/**
 * Created by catap_000 on 5/20/2017.
 */


const eventController = require('../controllers/eventController');
const path = require('path');
const fs = require('fs');

let helper = {};


helper.initializeApp = function(){
    eventController.createEventsFromRecurrentEventsForAllDojos();
    createMissingClientImgDirectories();
};

function createMissingClientImgDirectories(){
    let basicImgPath = __dirname + '/../client/img';
    let imageDirectoriesNeeded = [
        basicImgPath + '/badges/user_uploaded',
        basicImgPath + '/special_events/user_uploaded',
        basicImgPath + '/user_photos/user_uploaded'
    ];

    imageDirectoriesNeeded.forEach(function(dir){
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
    })
}

module.exports = helper;