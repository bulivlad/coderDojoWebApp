/**
 * Created by Adina Paraschiv on 3/4/2017.
 */

'use strict';
const mongoose = require('mongoose'),
    keys = require('../static_keys/project_keys'),
    logger = require('winston');

let dojoEventSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    maxNumberOfChildren: {
        type: Number,
        required: true
    },
    children: [
        {
            parentEmail: String,
            childName: String,
            childPhone: String,
            parentPhone: String,
            confirmed: {
                type: Boolean,
                default: false
            }
        }
    ]
});

let scheduleSchema = mongoose.Schema({
    startHour: {type: Number, max: 24, min: 0, required: true},
    endHour: {type: Number, max: 24, min: 0, required: true},
    startMinute: {type: Number, max: 60, min: 0, required: true},
    endMinute: {type: Number, max: 60, min: 0, required: true},
    day: {type: String, required: true},
    workshops: [String]
});

let DojoSchema = mongoose.Schema({
    name: {
        type: String,
        unique: true
    },
    address: String,
    latitude: Number,
    longitude: Number,
    email: String,
    statuses: [String],
    schedules: [scheduleSchema],
    facebook: String,
    twitter: String,
    requirements: [String],
    champion:[String],//TODO correct to the plural
    pendingChampions:[String],
    mentors: [String],
    pendingMentors:[String],
    volunteers: [String],
    pendingVolunteers:[String],
    attendees:[String],
    parents:[String],
    dojoEvents: [dojoEventSchema],
    pictureUrl: String
});


// Here we export the DataBase interface to our other modules
let Dojo = module.exports = mongoose.model("Dojo", DojoSchema);

let dojosFields = {
    name: true,
    latitude: true,
    longitude: true
};

let myDojosFields = {
    name: true,
    latitude: true,
    longitude: true,
    champion: true,
    mentors: true,
    parents: true,
    attendees: true,
    volunteers: true
};

//This are are basic dojo information, to show it on a map and a name for the dojo.
module.exports.getDojos = function(isForMyDojos, callback){
    let tempDojosFields = isForMyDojos ? myDojosFields : dojosFields;
    Dojo.find({},
        tempDojosFields, //Filter for dojo fields
        function(err, dojos){
        if(err){
            callback(err);
        } else {
            callback(null, dojos);
        }
    });
};

let dojoFields = {
    name: true,
    address: true,
    latitude: true,
    longitude: true,
    email: true,
    statuses: true,
    schedules: true,
    facebook: true,
    twitter: true,
    requirements: true,
    dojoEvents: true,
    pictureUrl: true
};

//This are dojos for users that ARE NOT authenticated
module.exports.getDojo = function(dojoId, callback){
    Dojo.findOne({_id: dojoId},
        dojoFields, //Filter for dojo fields
        function(err, dojo){
            if(err){
                callback(err);
            } else {
                callback(null, dojo);
            }
        });
};


let dojoAuthFields = {
    name: true,
    address: true,
    latitude: true,
    longitude: true,
    email: true,
    statuses: true,
    schedules: true,
    facebook: true,
    twitter: true,
    requirements: true,
    champion:true,
    pendingChampions:true,
    mentors: true,
    pendingMentors:true,
    volunteers: true,
    pendingVolunteers:true,
    attendees:true,
    parents: true,
    dojoEvents: true,
    pictureUrl: true
};

//This are dojos for users that ARE authenticated
module.exports.getAuthDojo = function(dojoId, callback){
    Dojo.findOne({_id: dojoId},
        dojoAuthFields, //Filter for dojo fields
        function(err, dojo){
            if(err){
                callback(err);
            } else {
                callback(null, dojo);
            }
        });
};

let fieldsForInternalDojoAuthentication = {
    champion:true,
    pendingChampions:true,
    mentors: true,
    pendingMentors:true,
    volunteers: true,
    pendingVolunteers:true,
    attendees:true,
    parents: true
};

//This method retrieves a dojos used for internal app verifications, the fields retrieved are mentioned above
module.exports.getDojoForInternalAuthentication = function(dojoId, callback){
    Dojo.findOne({_id: dojoId},
        fieldsForInternalDojoAuthentication, //Filter for dojo fields
        function(err, dojo){
            if(err){
                callback(err);
            } else {
                callback(null, dojo);
            }
        });
};

//We only modify the fields that can be edited
module.exports.updateDojo = function(dojo, callback){
    Dojo.findOneAndUpdate({_id:dojo._id},
        {$set: {name: dojo.name, address: dojo.address, latitude: dojo.latitude, longitude: dojo.longitude, email: dojo.email,
            statuses: dojo.statuses, schedules: dojo.schedules, facebook: dojo.facebook, twitter: dojo.twitter,
            requirements: dojo.requirements}},
        {new:true},
        function(err, dojo){
            logger.silly(`Updated dojo: ${JSON.stringify(dojo, null, 2)}`);
            callback(err);
        })
};