/**
 * Created by Adina Paraschiv on 4/24/2017.
 */

const mongoose = require('mongoose');
const keys = require('../static_keys/project_keys');
const logger = require('winston');


let ticketSchema = new mongoose.Schema({
    typeOfTicket: {
        type: String,
        enum: keys.typesOfTickets
    },
    nameOfTicket: {
        type: String
    },
    nrOfTickets: {
        type: Number
    },
    registeredMembers:[String]
});

let sessionSchema = new mongoose.Schema({
    workshop: {
        type: String
    },
    tickets: [ticketSchema],

    activeStatus: {
        type: String,
        enum: keys.activeStatus
    }
});

let eventSchema = new mongoose.Schema({
    startTime: {
        type: Date
    },
    endTime: {
        type: Date,
        index: true
    },
    name: {
        type: String
    },
    description: {
        type:String
    },
    dojo: {
        type: String,
        index: true
    },
    session: [sessionSchema],

    activeStatus: {
        type: String,
        enum: keys.activeStatus
    }

});

let recurrentEventSchema = module.exports.recurrentEventSchema = new mongoose.Schema({
    startHour: {type: Number, max: 24, min: 0},
    endHour: {type: Number, max: 24, min: 0},
    startMinute: {type: Number, max: 60, min: 0},
    endMinute: {type: Number, max: 60, min: 0},

    day: {
        type: String,
        enum: keys.daysOfWeek
    },
    name: {
        type: String
    },
    description: {
        type:String
    },
    sessions: [sessionSchema]
});