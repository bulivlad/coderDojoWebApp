/**
 * Created by catap_000 on 5/20/2017.
 */


const keys = require('../static_keys/project_keys');
const Event = require('../models/eventModel');
const Dojo = require('../models/dojoModel');
const logger = require('winston');
const helper = require('./helperController');

//method for getting current events for a dojo for unauthenticated users
module.exports.getCurrentDojoEvents = function(req, res){
    logger.debug(`Entering EvensRoute: ${keys.getCurrentDojoEventsRoute}`);
    let dojoId = req.body.dojoId;
    Event.getCurrentDojoEvents(dojoId, function(err, events){
        //cloning events as the original object is frozed.
        if(err){
            logger.error(`Error getting current events for dojo=(${dojoId})` + err);
            return res.sendStatus(500);
        }
        res.json({events: prepareEventsForGettingCurrentDojoEvents(events)});
    })

};

function prepareEventsForGettingCurrentDojoEvents(events){
    let ret = [];
    events.forEach(function(event){
        let cloneEvent = {};
        cloneEvent.name = event.name;
        cloneEvent.startTime = event.startTime;
        cloneEvent.endTime = event.endTime;
        cloneEvent.description = event.description;
        cloneEvent.copyOfRecurrentEvent = event.copyOfRecurrentEvent;
        let cloneSessions = [];
        event.sessions.forEach(function(session){
            cloneSessions.push({workshop: session.workshop});
        });
        cloneEvent.sessions = cloneSessions;
        ret.push(cloneEvent);
    });
    return ret;
}

//method for getting current events for a dojo for authenticated users
module.exports.getAuthCurrentDojoEvents = function(req, res){

};



//Method for creating events from recurrent events for all dojos. If an event for that a particular dojo for the next
//week has already been created in a previous run of the moethod, that recurrent event is skipped.
module.exports.createEventsFromRecurrentEventsForAllDojos = function(){
    logger.debug('Entering createEventsFromRecurrentEventsForAllDojos');
    Dojo.findDojosWithRecurrentEvents(function(err, dojos){
        if(err){
            logger.error(`Error getting dojos for creating recurrent events for all dojos`);
        }
        //We iterate through every dojo
        dojos.forEach(function(dojo){
            let listOfRecEventsIds = getListOfReccurentEventIds(dojo.recurrentEvents);
            Event.getCurrentEventsForADojoCreatedFromRecurrentEvents(dojo._id, listOfRecEventsIds, function(err, alreadyCreatedEvents){
                logger.silly(`determining which events need to be created for dojo (id=${dojo._id}, name=${dojo.name})`);
                //logger.silly(`alreadyCreatedEvents: ${JSON.stringify(alreadyCreatedEvents)}`);
                //logger.silly(`recurrentEvents: ${JSON.stringify(dojo.recurrentEvents)}`)
                if(err){
                    logger.error(`Error getting while getCurrentEventsForADojoCreatedFromRecurrentEvents for dojo ${dojo_id}`);
                }
                //We determine which recurrent events need to be recreated
                let eventsThatNeedToBeCreated = determineWhichEventsNeedToBeCreated(alreadyCreatedEvents, listOfRecEventsIds);
                logger.silly(`eventsThatNeedToBeCreated: ${eventsThatNeedToBeCreated.length > 0 ? eventsThatNeedToBeCreated: "NONE"}`);
                createEventsFromRecurrentEvents(eventsThatNeedToBeCreated, dojo.recurrentEvents, dojo._id);
            });
        });
    });
};

// recurrentEvents is a list of recurrent events (with all the info)
// eventsThatNeedToBeCreated is a list of ids of events that need to be created
function createEventsFromRecurrentEvents(eventsThatNeedToBeCreated, recurrentEvents, dojoId){
    recurrentEvents.forEach(function(recEvent){
        //If the recurrent event is in the list of events that need to be created, we create it
        if(eventsThatNeedToBeCreated.indexOf(recEvent._id) >= 0){
            createEventFromRecurrentEvent(recEvent, dojoId);
        }
    });
}

function createEventFromRecurrentEvent(recurrentEvent, dojoId){
    logger.silly(`Entering createEventFromRecurrentEvent`);
    let eventToSave = convertRecurrentEventToEvent(recurrentEvent, dojoId);
    Event.createEvent(eventToSave, function(err){
        if(err){
            logger.error(`Error saving event ${JSON.stringify(event)}`);
        }
    });
}


function convertRecurrentEventToEvent(recurrentEvent, dojoId){
    logger.debug(`Entering convertRecurrentEventToEvent`);
    logger.silly(`recurrentEvent=${JSON.stringify(recurrentEvent)}`);
    let event = {};
    event.name = recurrentEvent.name;
    event.description = recurrentEvent.description;
    event.copyOfRecurrentEvent = recurrentEvent._id;

    let startEndTime = getNextEventTimes(recurrentEvent.startHour, recurrentEvent.startMinute, recurrentEvent.endHour,
                          recurrentEvent.endMinute, recurrentEvent.day);

    event.startTime = startEndTime.startDate;
    event.endTime = startEndTime.endDate;
    event.dojoId = dojoId;
    event.sessions = convertEventSessions(recurrentEvent.sessions);
    return event;
}

//Method that converts a list of sessions from the recurrent event format to the event format
function convertEventSessions(eventSessions){
    let ret = [];
    eventSessions.forEach(function(session){
        if(helper.isActive(session)){
            session.tickets.forEach(function(ticket){
                ticket.registeredMembers = [];
            });
            ret.push(session);
        }
    });
    return ret;
}

//This method receives an hour, minutes and day, and returns a date when the event will occur next (less then a week)
function getNextEventTimes(startHour, startMinute, endHour, endMinute, day){
    let now = new Date();
    let ret = {};
    let daysToAdd = getNumberOfDaysToAdd(now, keys.daysOfWeek.indexOf(day), startHour, startMinute);

    let startDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    startDate.setHours(startHour);
    startDate.setMinutes(startMinute);
    startDate.setSeconds(0);
    ret.startDate = startDate;

    let endDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    endDate.setHours(endHour);
    endDate.setMinutes(endMinute);
    endDate.setSeconds(0);
    ret.endDate = endDate;

    return ret;

}

function getNumberOfDaysToAdd(dateNow, indexOfSelectedDay, startHours, startMinutes, eventRecurrence){
    let indexOfNow = dateNow.getDay();
    if(indexOfSelectedDay > indexOfNow){
        return indexOfSelectedDay - indexOfNow;
    } else if(indexOfSelectedDay == indexOfNow){
        //If they are on the same day, we check if the potential date is later than right now (case which days to add is 0)
        // if it is earlier, then the potential date has to be next week (case where we add 7);
        let startTimeOfEvent = new Date();
        startTimeOfEvent.setHours(startHours);
        startTimeOfEvent.setMinutes(startMinutes);
        //If the start time is later than now, we can start on the same day
        if(startTimeOfEvent > dateNow){
            return 0;
        } else {
            return 7;
        }
    }else {
        let daysToAdd = 0;
        while(indexOfNow != indexOfSelectedDay){
            indexOfNow++;
            if(indexOfNow === 7){
                indexOfNow = 0;
            }
            daysToAdd++;
        }
        return daysToAdd;
    }
}

function isWeeklyEvent(eventRecurrence){
    return keys.eventRecurrence[0] === eventRecurrence;
}

function isBiWeeklyEvent(eventRecurrence){
    return keys.eventRecurrence[1] === eventRecurrence;
}

function isMonthlyEvent(eventRecurrence){
    return keys.eventRecurrence[2] === eventRecurrence;
}

//Method that has two lists as arguments. A list of current dojo events, and a list of the recurrent events of the dojo.
//It returns a list of rec events that need to be created.
function determineWhichEventsNeedToBeCreated(currentEventsOfDojo, recurrentEventsIds){
    logger.silly(`Entering determineWhichEventsNeedToBeCreated`);
    let ret = [];
    //We exact from the list of current events a list of id's of recurrent evens from which the event was created
    let listOfCurrentEventCopyFromIds = getListOfFieldsFromListOfObjects(currentEventsOfDojo, 'copyOfRecurrentEvent');
    recurrentEventsIds.forEach(function(recEventId){
        //If the current recurrent event is't in the list of created events, we added to the list
        if(!isContainedInList(listOfCurrentEventCopyFromIds, recEventId)){
            ret.push(recEventId);
        }
    });
    return ret;
}

function getListOfReccurentEventIds(recurrentEvents){
    let ret = [];
    recurrentEvents.forEach(function(recEvent){
        if(helper.isActive(recEvent)){
            ret.push(recEvent._id);
        }
    });
    return ret;
}

//Method for extracting a list of fields from a list of object (that have the fields)
function getListOfFieldsFromListOfObjects(list, field){
    let ret = [];
    list.forEach(function(item){
        ret.push(item[field]);
    });
    return ret;
}

function isContainedInList(list, el){
    for(let i = 0; i < list.length; i++){
        let curEl = list[i];
        if(curEl.toString() === el.toString()){
            return true;
        }
    }
    return false;
}