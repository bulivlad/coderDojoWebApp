/**
 * Created by Adina Paraschiv on 3/4/2017.
 */

'use strict';
const mongoose = require('mongoose'),
    keys = require('../static_keys/project_keys');

let DojoSchema = mongoose.Schema({
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

// Here we export the DataBase interface to our other modules
let Dojo = module.exports = mongoose.model("Dojo", DojoSchema);


module.exports.getDojos = function(callback){
    Dojo.find({"date": {"$gte": new Date()}},//getting entries only after the current date
        null,
        {sort:{date: 1}}, //Sorting by date
        function(err, dojos){
        if(err){
            callback(err);
        } else {
            callback(null, dojos);
        }
    });

}
