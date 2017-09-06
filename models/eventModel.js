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
    registeredMembers: [
        {
            userId: {type: String, required: true},
            confirmed: Boolean
        }
    ],

    workshop: {
        type: String
    },

    sessionId: {
        type: String
    },

    activeStatus: {
        type: String,
        enum: keys.eventStatus,
        default: keys.eventStatus[0]
    }
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
    eventRecurrenceType: {
        type:String,
        enum: keys.eventRecurrenceTypes,
    },
    activeStatus: {
        type: String,
        enum:keys.eventStatus,
        default: keys.eventStatus[0]
    },
    //This has a list of tickets instead of a list of sessions with tickets inside because you cannot to an atomic
    // operation to add something to an array within an array withing an array (sessions.tickets.registeredMembers)
    // but you can with only two levels(tickets.registeredMembers)
    tickets: [ticketSchemaEvents],

    isActualEvent: {//This exists to easily differentiate between recurrent event and events (it is never changed)
        type: Boolean,
        default: true
    },
    invitesAlreadySent: [String]
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

    eventRecurrenceType: {
        type:String,
        enum: keys.eventRecurrenceTypes,
    },
    recurrenceDay: {
        type: Date
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
    }
});

let Event = mongoose.model("Event", eventSchema);

//Method that returns all current events (event that end after the current date) that were created from recurrent event
//(we need to know which are created from recurrent events so we do not have duplicates).
module.exports.getCurrentEventsForADojoCreatedFromRecurrentEvents = function(dojoId, listOfRecEvents, callback){
    Event.find({endTime: {$gt: Date.now()}, dojoId: dojoId, copyOfRecurrentEvent: {$in: listOfRecEvents}}, {copyOfRecurrentEvent: true}, callback);
};

//Method for saving events
module.exports.createEvent = function(event, callback){
    let eventToSave = new Event(event);
    eventToSave.save(callback);
};


let fieldsToGetForCurrentDojoEvents = {
    startTime: true,
    endTime: true,
    name: true,
    description: true,
    dojoId: true,
    tickets: true,
    copyOfRecurrentEvent: true,
    eventRecurrenceType: true
};

module.exports.getCurrentDojoEvents = function(dojoId, callback){
    Event.find({dojoId:dojoId, endTime: {$gt: Date.now()}}, fieldsToGetForCurrentDojoEvents, callback);
};

let fieldsToGetForAuthCurrentDojoEvents = {
    startTime: true,
    endTime: true,
    name: true,
    description: true,
    dojoId: true,
    tickets: true,
    copyOfRecurrentEvent: true,
    eventRecurrenceType: true
};

module.exports.getAuthCurrentDojoEvents = function(dojoId, callback){
    Event.find({dojoId:dojoId, endTime: {$gt: Date.now()}}, fieldsToGetForAuthCurrentDojoEvents, callback);
};

module.exports.getAuthCurrentEventsForAllDojos = function(callback){
    Event.find({endTime: {$gt: Date.now()}}, fieldsToGetForAuthCurrentDojoEvents, callback);
};

let fieldsToGetForCurrentEventsForAllDojos = {
    startTime: true,
    endTime: true,
    name: true,
    description: true,
    dojoId: true,
    tickets: true,
    copyOfRecurrentEvent: true,
    typeOfReccurentEvent: true
};

module.exports.getCurrentEventsForAllDojos = function(callback){
    Event.find({endTime: {$gt: Date.now()}}, fieldsToGetForCurrentEventsForAllDojos, callback);
};

module.exports.getEvent = function(eventId, callback){
    Event.findOne({_id: eventId}, callback);
};

module.exports.getEventTickets = function(eventId, callback){
    Event.findOne({_id: eventId}, {tickets: true},callback);
};

//Method for registering user to event
module.exports.registerUserForEvent = function(eventId, ticketId, userIdToAddToEvent, callback){
    Event.findOneAndUpdate({_id: eventId, tickets: {$elemMatch:{_id: ticketId}} },
        {$addToSet: {'tickets.$.registeredMembers': {userId: userIdToAddToEvent, confirmed: false}}}, callback);
};

//Method for removing user from event
module.exports.removeUserFromEvent = function(eventId, ticketId, userIdToRemoveFromEvent, callback){
    Event.findOneAndUpdate({_id: eventId, 'tickets._id': ticketId},
        {$pull: {'tickets.$.registeredMembers': {userId: userIdToRemoveFromEvent}}}, callback);
};

module.exports.confirmOrRemoveUserFromEvent = function(data, callback){
    if(data.whichAction === keys.eventRemoveUser){
        Event.findOneAndUpdate({_id: data.eventId, 'tickets._id': data.ticketId},
            {$pull: {'tickets.$.registeredMembers': {_id: data.regUserId}}}, {new:true}, callback);
    } else {
        //Confirm user path. First we must remove the user from the database, and then add him/her back confirmed
        // I have not found a more efficient way to do this at the moment, but there must be one
        Event.findOneAndUpdate({_id: data.eventId, 'tickets._id': data.ticketId},
            {$pull: {'tickets.$.registeredMembers': {_id: data.regUserId}}}, {_id:1}, function(err){
                if(err){
                    logger.error(`Error removing user (id=${data.userToAddOrRemoveId}) from event right before adding him confirmed:` + err);
                    return res.sendStatus(500);
                }
                //Now we add the user as confirmed
                Event.findOneAndUpdate({_id: data.eventId, 'tickets._id': data.ticketId},
                    {$addToSet: {'tickets.$.registeredMembers':
                    {_id:data.regUserId,userId: data.userToAddOrRemoveId, confirmed: true}}}, {new:true}, callback);
            });
    }
};

module.exports.deleteEvent = function(eventId, callback){
    Event.remove({_id:eventId}, callback);
};

module.exports.editEvent = function(updatedEvent, callback){
    Event.findOneAndUpdate({_id: updatedEvent._id},
        {
            $set: {
                name:updatedEvent.name,
                activeStatus: updatedEvent.activeStatus,
                startTime: updatedEvent.startTime,
                endTime: updatedEvent.endTime,
                description: updatedEvent.description,
                tickets: updatedEvent.tickets
            }
        }, callback);
};

module.exports.getUsersInvitedToEvent = function(eventId, callback){
    Event.findOne({_id:eventId}, {invitesAlreadySent: true}, callback);
};

module.exports.addToUsersInvited = function(eventId, invitesToAdd, callback){
  Event.findOneAndUpdate({_id:eventId}, {$addToSet: {invitesAlreadySent: {$each: invitesToAdd}}}, callback);
};