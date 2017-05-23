/**
 * Created by Adina Paraschiv on 4/24/2017.
 */

const mongoose = require('mongoose');
const keys = require('../static_keys/project_keys');
const logger = require('winston');

let ticketSchemaEvents = new mongoose.Schema({
    typeOfTicket: {
        type: String,
        enum: keys.typesOfTickets
    },
    nameOfTicket: {
        type: String
    },
    numOfTickets: {
        type: Number
    },
    registeredMembers: [{userId: String, confirmed: Boolean}]
});


let ticketSchemaRecurrentEvents = new mongoose.Schema({
    typeOfTicket: {
        type: String,
        enum: keys.typesOfTickets
    },
    nameOfTicket: {
        type: String
    },
    numOfTickets: {
        type: Number
    }
});

let sessionSchemaEvents = new mongoose.Schema({
    workshop: {
        type: String
    },
    tickets: [ticketSchemaEvents],

    activeStatus: {
        type: String,
        enum: keys.eventStatus
    }
});

let sessionSchemaRecurrentEvents = new mongoose.Schema({
    workshop: {
        type: String
    },
    tickets: [ticketSchemaRecurrentEvents],

    activeStatus: {
        type: String,
        enum: keys.eventStatus
    }
});

let eventSchema = module.exports.eventSchema = new mongoose.Schema({
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
    dojoId: {
        type: String,
        index: true
    },
    copyOfRecurrentEvent: {
      type:String
    },
    sessions: [sessionSchemaEvents],

    isActualEvent: {//This exists to easily differentiate between recurrent event and events (it is never changed)
        type: Boolean,
        default: true
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
    sessions: [sessionSchemaRecurrentEvents],

    activeStatus: {
        type: String,
        enum: keys.eventStatus
    },
});

// Here we export the DataBase interface to our other modules
let Event = mongoose.model("Event", eventSchema);

//Method that returns all current events (event that end after the current date) that were created from recurrent event
//(we need to know which are created from recurrent events so we do not have duplicates).
module.exports.getCurrentEventsForADojoCreatedFromRecurrentEvents = function(dojoId, listOfRecEvents, callback){
    Event.find({endTime: {$gt: Date.now()}, dojoId: dojoId, copyOfRecurrentEvent: {$in: listOfRecEvents}}, {copyOfRecurrentEvent: true}, callback);
};

//Method for saving events
module.exports.createEvent = function(event, callback){
    logger.silly(`entering createEvent event=${JSON.stringify(event)}`);
    let eventToSave = new Event(event);
    logger.silly(`eventToSave=${JSON.stringify(event)}`);
    eventToSave.save(callback);
};


let fieldsToGetForCurrentDojoEvents = {
    startTime: true,
    endTime: true,
    name: true,
    description: true,
    dojoId: true,
    sessions: true,
    copyOfRecurrentEvent: true
};

module.exports.getCurrentDojoEvents = function(dojoId, callback){
    Event.find({dojoId:dojoId, endTime: {$gt: Date.now()}}, fieldsToGetForCurrentDojoEvents, callback);
};