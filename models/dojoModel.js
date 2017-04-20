/**
 * Created by Adina Paraschiv on 3/4/2017.
 */

'use strict';
const mongoose = require('mongoose'),
    keys = require('../static_keys/project_keys');

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

let orarSchema = mongoose.Schema({
    startHour: {type: Number, max: 24, min: 0},
    endHour: {type: Number, max: 24, min: 0},
    startMinute: {type: Number, max: 60, min: 0},
    endMinute: {type: Number, max: 60, min: 0},
    day: String
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
    status: String,
    orar: [orarSchema],
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

let dojoFields = {
    name: true,
    address: true,
    latitude: true,
    longitude: true,
    email: true,
    status: true,
    orar: true,
    facebook: true,
    twitter: true,
    requirements: true,
    dojoEvents: true,
    pictureUrl: true
};

//This are dojos for users that are NOT authenticated
module.exports.getDojos = function(callback){
    Dojo.find({},
        dojoFields, //Filter for dojo fields
        function(err, dojos){
        if(err){
            callback(err);
        } else {
            callback(null, dojos);
        }
    });
};

let dojoAuthFields = {
    name: true,
    address: true,
    latitude: true,
    longitude: true,
    email: true,
    status: true,
    orar: true,
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
module.exports.getAuthDojos = function(callback){
    Dojo.find({},//getting entries only after the current date
        dojoAuthFields, //Filter for dojo fields
        function(err, dojos){
            if(err){
                callback(err);
            } else {
                callback(null, dojos);
            }
        });
};
