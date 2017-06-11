/**
 * Created by catap_000 on 5/20/2017.
 */


const keys = require('../static_keys/project_keys');
const Event = require('../models/eventModel');
const Dojo = require('../models/dojoModel');
const dojoController = require('./dojosController')
const User = require('../models/userModel');
const logger = require('winston');
const helper = require('./helperController');

//method for getting current events for a dojo for unauthenticated users
module.exports.getCurrentDojoEvents = function(req, res){
    logger.debug(`Entering EventsRoute: ${keys.getCurrentDojoEventsRoute}`);
    let dojoId = req.body.dojoId;
    Event.getCurrentDojoEvents(dojoId, function(err, events){
        //cloning events as the original object is frozen.
        if(err){
            logger.error(`Error getting current events for dojo=(${dojoId})  from database` + err);
            return res.sendStatus(500);
        }
        res.json({events: prepareEventsForGettingCurrentDojoEvents(events)});
    })

};

//We only add the session workshops, no other info for this call
function prepareEventsForGettingCurrentDojoEvents(events){
    logger.silly(`entering prepareEventsForGettingCurrentDojoEvents - events=${JSON.stringify(events)}`);
    let ret = [];
    events.forEach(function(event){
        let cloneEvent = {};
        cloneEvent.name = event.name;
        cloneEvent.startTime = event.startTime;
        cloneEvent.endTime = event.endTime;
        cloneEvent.description = event.description;
        cloneEvent.copyOfRecurrentEvent = event.copyOfRecurrentEvent;
        cloneEvent._id = event._id;
        let cloneTickets = [];
        event.tickets.forEach(function(ticket){
            cloneTickets.push({workshop: ticket.workshop, sessionId: ticket.sessionId});
        });
        cloneEvent.tickets = cloneTickets;
        ret.push(cloneEvent);
    });
    return ret;
}

//method for getting current events for a dojo for authenticated users
module.exports.getAuthCurrentDojoEvents = function(req, res){
    logger.debug(`Entering EventsRoute: ${keys.getAuthCurrentDojoEventsRoute}`);
    let dojoId = req.body.dojoId;
    let user = req.user;
    Event.getAuthCurrentDojoEvents(dojoId, function(err, events){
        if(err){
            logger.error(`Error getting current auth events for dojo=(${dojoId}) for ${helper.getUser(req)}  from database` + err);
            return res.sendStatus(500);
        }
        let preparedEvents = prepareEventsForGettingAuthCurrentDojoEvents(events, user);

        let regUsers = extractRegisteredUsersFromPreparedEvents(preparedEvents);
        //If the user or his/her children are registered for the events
        if(regUsers.length > 0){
            let childrenRegisteredForEvent = extractChildrenRegisteredForEvent(regUsers, user._id.toString());
            if(childrenRegisteredForEvent.length > 0){
                logger.silly('User or his/her children registered for event');
                //If there are children of the user registered for the event, we get the children's name (we also filter for
                // users children that are under 18
                User.getUsersNames(childrenRegisteredForEvent, true, function(err, children){
                    if(err){
                        logger.error(`Error getting children's names for ${helper.getUser(req)} for getting auth events from database` + err);
                        return res.sendStatus(500);
                    }
                    addChildrenNames(preparedEvents, children);
                    res.json({events: preparedEvents});
                });

            } else {
                logger.silly('Only User registered for event');
                //If there are no children of the user registered for the events, we send the events
                res.json({events: preparedEvents});
            }
        } else {
            logger.silly('User and his/her children NOT registered for event');
            //If the user or his/her children are NOT registered for the events
            res.json({events: preparedEvents});
        }

    });
};

//Method for extracting the registered users (pertaining to the current user) registered for an event
function extractRegisteredUsersFromPreparedEvents(preparedEvents){
    let ret = [];
    preparedEvents.forEach(function(preparedEvent){
        preparedEvent.regUsers.forEach(function(regUser){
            //Add the registered user only once
            if(ret.indexOf(regUser.userId.toString()) < 0){
                ret.push(regUser.userId.toString());
            }
        });
    });


    return ret;
}

//Method for preparing events for dojo for authenticated users
function prepareEventsForGettingAuthCurrentDojoEvents(events, user){
    let ret = [];
    events.forEach(function(event){
        let cloneEvent = {};
        cloneEvent.name = event.name;
        cloneEvent.startTime = event.startTime;
        cloneEvent.endTime = event.endTime;
        cloneEvent.description = event.description;
        cloneEvent.copyOfRecurrentEvent = event.copyOfRecurrentEvent;
        cloneEvent._id = event._id;
        cloneEvent.regUsers = [];
        let cloneTickets = [];

        event.tickets.forEach(function(ticket){
            let cloneTicket = {workshop: ticket.workshop, sessionId: ticket.sessionId};
            cloneTickets.push(cloneTicket);
            //We check if the user is registered for the ticket in the session of the event
            let userRegistered = isUserRegisteredForSessionTicket(ticket.registeredMembers, user._id);
            if(userRegistered){
                cloneEvent.regUsers.push({firstName: user.firstName, lastName:user.lastName, userId: user._id.toString(),
                    workshop: ticket.workshop, nameOfTicket: ticket.nameOfTicket, status: userRegistered.confirmed});
            }
            //We check if the user's children registered for the ticket in the session of the event
            user.children.forEach(function(childId){
                let childRegistered = isUserRegisteredForSessionTicket(ticket.registeredMembers, childId);
                if(childRegistered){
                    cloneEvent.regUsers.push({userId:childId.toString(), workshop: ticket.workshop,
                        nameOfTicket: ticket.nameOfTicket, status: childRegistered.confirmed});
                }
            });

        });
        cloneEvent.tickets = cloneTickets;
        ret.push(cloneEvent);
    });
    return ret;
}

//Method for separating the children from the user in the users registered for an event. Method returns an array of child
//ids.
function extractChildrenRegisteredForEvent(regUsers, userId){
    let ret = [];
    regUsers.forEach(function(regUser){
        if(regUser.userId != userId){
            ret.push(regUser);
        }
    });
    return ret;
}

//Method that returns the registered member, it he/she is found
function isUserRegisteredForSessionTicket(registeredMembers, userId){
    for(let i = 0; i < registeredMembers.length; i++){
        let registeredMember = registeredMembers[i];
        if(registeredMember.userId == userId.toString()){
            return registeredMember;
        }
    }
}

//Method gets the child's name from the children array based on the child id, and adds it to the regUsers object.
function addChildrenNames(preparedEvents, children){
    let mapOfChildren = makeMapOfUserIdToName(children);
    //We iterate through the prepared events, then to the registered users array for every event
    preparedEvents.forEach(function(preparedEvent){
        preparedEvent.regUsers.forEach(function(regUser){
            let fullName = mapOfChildren[regUser.userId];
            if(fullName){
                regUser.firstName = fullName.firstName;
                regUser.lastName = fullName.lastName;
            }
        });
    });
}

//Makes a map of user _id as key to a value of the user's name
function makeMapOfUserIdToName(users){
    let ret = {};
    users.forEach(function(user){
        ret[user._id.toString()] = {firstName: user.firstName,  lastName :user.lastName};
    });
    return ret
}

//method for getting an event for unauthenticated users
module.exports.getAuthEvent = function(req, res){
    logger.debug(`Entering EventsRoute: ${keys.getAuthEventRoute}`);
    let eventId = req.body.eventId;
    let user = req.user;
    Event.getEvent(eventId, function(err, event){
        if(err){
            logger.error(`Error getting auth event eventId(${eventId}) for ${helper.getUser(req)} from database` + err);
            return res.sendStatus(500);
        }
        Dojo.findDojoForAuthEvent(event.dojoId, function(err, dojo){
            if(err){
                logger.error(`Error getting dojo (dojoId=${event.dojoId}) for preparing auth event eventId(${eventId}) for` +
                    `${helper.getUser(req)} from database` + err);
                return res.sendStatus(500);
            }
            //If the user has children, we need to get the children's names
            if(user.children.length > 0){
                // If the user has children that need to be added options for, we need to to to the data base to get the
                // children's name (we also filter for users children that are under 18)
                User.getUsersNames(user.children, true, function(err, usersChildren){
                    if(err){
                        logger.error(`Error getting children names for preparing auth event eventId(${eventId}) for` +
                            `${helper.getUser(req)} from database` + err);
                        return res.sendStatus(500);
                    }

                    //First step in preparing the event (determining if the user is registered for the event)
                    let preparedEvent = prepareEvent(event, user, usersChildren);
                    //We determine if the user or users children are already registered to the event
                    let usersRegisteredToEventList = getUsersRegisteredForEvent(preparedEvent);

                    //We determine if the current user is already registered in the event (you can only be registered once to a event)
                    let userIdRegToEvent = getUserFromSetOfUsers(usersRegisteredToEventList, user);
                    if(!userIdRegToEvent){
                        // If the user isn't already registered to the event, we add options for joining (based on his dojo membership
                        // status
                        logger.silly(`User isn't already added to event`);
                        addUserJoinOptionsToEvent(preparedEvent, dojoController.getUserRoleInDojo(dojo, user._id), user);
                    }

                    //We determine which children of the user have to be added to event (list of childIds)
                    let usersChildrenToAddJoinOptionsToEvent = getUsersChildrenNotAlreadyRegistered(usersRegisteredToEventList, usersChildren);

                    //Now we add the children's join options for the event
                    usersChildrenToAddJoinOptionsToEvent.forEach(function(child){
                        addUserJoinOptionsToEvent(preparedEvent, dojoController.getUserRoleInDojo(dojo, child._id), child);
                    });

                    //Lastly we add the user's permissions on the event
                    addUserPermissionsToEvent(preparedEvent, user, dojo, event);
                    res.json({event:preparedEvent})

                });
            } else {
                //First step in preparing the event (determining if the user is registered for the event)
                let preparedEvent = prepareEvent(event, user);
                //We determine if the user or users children are already registered to the event
                let usersRegisteredToEventList = getUsersRegisteredForEvent(preparedEvent);

                //We determine if the current user is already registered in the event (you can only be registered once to a event)
                let userIdRegToEvent = getUserFromSetOfUsers(usersRegisteredToEventList, user);
                if(!userIdRegToEvent){
                    // If the user isn't already registered to the event, we add options for joining (based on his dojo membership
                    // status
                    logger.silly(`User isn't already added to event`);
                    addUserJoinOptionsToEvent(preparedEvent, dojoController.getUserRoleInDojo(dojo, user._id), user);
                }

                //Lastly we add the user's permissions on the event
                addUserPermissionsToEvent(preparedEvent, user, dojo, event);
                res.json({event:preparedEvent})
            }
        });
    });
};


//method for getting an event for authenticated users
module.exports.getEvent = function(req, res){
    logger.debug(`Entering EventsRoute: ${keys.getEventRoute}`);
    let eventId = req.body.eventId;
    Event.getEvent(eventId, function(err, event){
        if(err){
            logger.error(`Error getting event eventId(${eventId}) from database` + err);
            return res.sendStatus(500);
        }
        logger.silly(`event = ${JSON.stringify(event)}`);
        res.json({event: prepareEvent(event, false)});
    });
};

//Method that prepares an event for users. The user argument is used for preparing the event for authenticated users
function prepareEvent(event, user, usersChildren){
    logger.silly(`Entering prepareEvent`);
    let ret = {};
    ret.startTime = event.startTime;
    ret.endTime = event.endTime;
    ret.name = event.name;
    ret.dojoId = event.dojoId;
    ret.description = event.description;
    ret.copyOfRecurrentEvent = event.copyOfRecurrentEvent;
    ret._id = event._id;
    let tickets = [];
    ret.tickets = tickets;
    event.tickets.forEach(function(ticket){
        let tempTicket = {typeOfTicket: ticket.typeOfTicket, nameOfTicket: ticket.nameOfTicket,
            sessionId:ticket.sessionId, workshop: ticket.workshop};
        let remainingSeats = ticket.numOfTickets - ticket.registeredMembers.length;
        tempTicket.remainingSeats = remainingSeats;
        tempTicket._id = ticket._id;
        tempTicket.ticketOptions = [];
        if(user){
            //If this is for authenticated users, we check if the user, or his or her children are registered to
            //participate in the tickets for the sessions of the event

            //First we check if the user is registered
            let userRegistered = isUserRegisteredForSessionTicket(ticket.registeredMembers, user._id);
            if(userRegistered){
                tempTicket.ticketOptions.push({
                    status: userRegistered.confirmed ? keys.eventStatus_Confirmed : keys.eventStatus_Registered,
                    firstName: user.firstName, lastName: user.lastName, userId: user._id
                });
            }
            //Next we check the users' children
            if(usersChildren){
                usersChildren.forEach(function(child){
                    let childRegistered = isUserRegisteredForSessionTicket(ticket.registeredMembers, child._id);
                    if(childRegistered){
                        tempTicket.ticketOptions.push({
                            status: childRegistered.confirmed ? keys.eventStatus_Confirmed : keys.eventStatus_Registered,
                            userId: child._id,
                            firstName: child.firstName, lastName:child.lastName
                        })
                    }
                })
            }

        } else {
            //This adds the default actions for the ticket for unauthenticated users
            tempTicket.ticketOptions.push({status:keys.eventStatus_userNotLoggedIn})
        }
        tickets.push(tempTicket);
    });
    //logger.silly(`The preparedEvent: ${JSON.stringify(ret)}`);
    return ret;
}

//Method that searches an event for users already registered for it, and returns a set of user ids
function getUsersRegisteredForEvent(event){
    let ret = [];
    event.tickets.forEach(function(ticket){
        // The users registered are added as ticketOptions to the the ticket. We add the userIds from the ticket options
        // to the returned array
        ticket.ticketOptions.forEach(function(ticketOption){
            //We need to add the String variant (it is originally ObjectId)
            ret.push(ticketOption.userId.toString());
        });
    });
    return ret;
}

//Method that finds the user id in a set of user id
function getUserFromSetOfUsers(listOfUsersIds, testUser){
    return listOfUsersIds.indexOf(testUser._id.toString()) > -1;
}

//Method for adding options to join an event for a user (de options depend on what kind of role the user has in the dojo).
// Ex: he/she can only join a mentor ticket if he's a mentor in the dojo
function addUserJoinOptionsToEvent(event, userRoleInDojo, user){
    //logger.silly(`Entering addUserJoinOptionsToEvent for user ${JSON.stringify(user)}, user role = ${userRoleInDojo}`);
    logger.silly(`event = ${JSON.stringify(event)}`);
    event.tickets.forEach(function(ticket){
        if(ticket.typeOfTicket == userRoleInDojo){
            ticket.ticketOptions.push({
                status: keys.eventStatus_NotRegistered,
                userId:user._id.toString(),
                firstName: user.firstName, lastName: user.lastName
            });
        }
    });
}

//Method for selecting which of the users children still need to be in the event
function getUsersChildrenNotAlreadyRegistered(listOfUsersRegForEvent, usersChildren){
    let ret = [];
    usersChildren.forEach(function(child){
        //If the list of registered users does not contain the users child, we add him/her
        if(listOfUsersRegForEvent.indexOf(child._id.toString()) < 0){
            ret.push(child)
        }
    });
    return ret;
}

//Method for adding permissions to an event based on user role in dojo
//Arguments
//  preparedEvent - the event that is sent to the GUI (where the permissions are added)
//  user - the user object where the identifying information is
//  dojo - the dojo (to identify if the user is champion)
//  originalEvent - the original event, with the registered members needed for authentification

function addUserPermissionsToEvent(preparedEvent, user, dojo, originalEvent){
    if(helper.isUserAdmin(user) || helper.isUserChampionInDojo(dojo, user._id)){
        preparedEvent[keys.canEditEvent] = true;
        preparedEvent[keys.canDeleteEvent] = true;
        preparedEvent[keys.canSeeJoinedEventUsers] = true;
        //preparedEvent[keys.canConfirmEventUsers] = true;
    } else if(helper.isUserMentorInEvent(originalEvent, user._id) || helper.isUserVolunteerInEvent(originalEvent, user._id)){
        preparedEvent[keys.canSeeJoinedEventUsers] = true;
        //preparedEvent[keys.canConfirmEventUsers] = true;
    }
}

//Method for registering a user for an event
module.exports.registerUserForEvent = function(req, res){
    logger.debug(`Entering EventsRoute: ${keys.registerUserForEventRoute} by ${helper.getUser(req)}`);
    let user = req.user;
    let userIdToAddToEvent = req.body.userId;
    let ticketId = req.body.ticketId;
    let dojoId = req.body.dojoId;
    let eventId = req.body.eventId;
    //We check if the user is registering himself/herself or any of his/her children
    if(user._id == userIdToAddToEvent || helper.isUsersChild(user, {_id:userIdToAddToEvent})){
        //We check if the user is still a member of the dojo
        Dojo.getDojoForInternalAuthentication(dojoId, function(err, dojo){
            if(err){
                logger.error(`Error getting dojo by ${helper.getUser(req)}, for  ${keys.registerUserForEventRoute}:` + err);
                return res.sendStatus(500);
            }
            //We check if the user we are trying to get to join the event is a member of the dojo
            if(helper.isUserMemberOfDojo(dojo, userIdToAddToEvent)){
                //Now we check if the user is already registered to the event to avoid double bookings
                Event.getEventTickets(eventId, function(err, event){
                    if(err){
                        logger.error(`Error getting event by ${helper.getUser(req)}, for checking if the user is already` +
                            ` registered to event for ${keys.registerUserForEventRoute}:` + err);
                        return res.sendStatus(500);
                    }
                    //User being added is already registered to the event
                    if(userIsRegisteredToEvent(event, userIdToAddToEvent)){
                        logger.error(`User (_id=${userIdToAddToEvent}) is already registered to the event, request by ${helper.getUser(req)}`);;
                        res.json({errors: keys.userAlreadyRegisteredForEventError});
                    } else {
                        //User being added is not already registered to the event, so we will register him/her
                        Event.registerUserForEvent(eventId, ticketId, userIdToAddToEvent, function(err){
                            if(err){
                                logger.error(`Error registering user (_id=${userIdToAddToEvent} by ${helper.getUser(req)}, ` +
                                    `to event (_id=${eventId}):` + err);
                                return res.sendStatus(500);
                            }
                            res.json({success:true});
                        });
                    }
                });
            } else {
                //The user being added to the event is not a member of the dojo
                logger.error(`${helper.getUser(req)} is attempting to register for event (id=${eventId}) a user ` +
                    ` (userIdToAddToEvent = ${userIdToAddToEvent}), that is not a member of the dojo (_id=${dojoId}`);
                res.json({errors:keys.userNoLongerPartOfDojo});
            }
        })

    } else {
        logger.error(`${helper.getUser(req)} is attempting to register for event (id=${eventId}) a user that is not` +
            ` himself or any of his/her children (userIdToAddToEvent = ${userIdToAddToEvent})`);
        res.json({errors:keys.wrongUserError});
    }

};

//Method that checks if a user is registered to an event
let userIsRegisteredToEvent = function(event, userIdToAddToEvent){
    event.tickets.forEach(function(ticket){
        //If the ticket is active
        if(ticket.activeStatus == keys.eventStatus[0])
            ticket.registeredMembers.forEach(function(regMember){
                if(regMember._id == userIdToAddToEvent){
                    return true;
                }
            });
    })
};

//Method for canceling a user's registration for an event
module.exports.removeUserFromEventEvent = function(req, res){
    logger.debug(`Entering EventsRoute: ${keys.removeUserFromEventRoute} by ${helper.getUser(req)}`);
    let user = req.user;
    let userIdToRemoveToEvent = req.body.userId;
    let ticketId = req.body.ticketId;
    let eventId = req.body.eventId;
    //We check if the user is registering himself/herself or any of his/her children
    if(user._id == userIdToRemoveToEvent || helper.isUsersChild(user, {_id:userIdToRemoveToEvent})){
        //User being added is not already registered to the event, so we will register him/her
        Event.removeUserFromEvent(eventId, ticketId, userIdToRemoveToEvent, function(err){
            if(err){
                logger.error(`Error removing user (_id=${userIdToRemoveToEvent} by ${helper.getUser(req)}, ` +
                    `from event (_id=${eventId}):` + err);
                return res.sendStatus(500);
            }
            res.json({success:true});
        });

    } else {
        logger.error(`${helper.getUser(req)} is attempting to remove from event (id=${eventId}) a user that is not` +
            ` himself or any of his/her children (userIdToAddToEvent = ${userIdToRemoveToEvent})`);
        res.json({errors:keys.wrongUserError});
    }
};

module.exports.getUsersRegisteredForEvent = function(req, res){
    logger.debug(`Entering EventsRoute: ${keys.getUsersRegisteredForEventRoute} by ${helper.getUser(req)}`);
    let startTime = new Date();
    let dojoId = req.body.dojoId;
    let eventId = req.body.eventId;
    let user = req.user;
    Event.getEventTickets(eventId, function(err, event){
        if(err){
            logger.error(`Error getting event by ${helper.getUser(req)}, for getting users registered for event ` +
                ` (id=${eventId}) for ${keys.getUsersRegisteredForEventRoute}:` + err);
            return res.sendStatus(500);
        }
        //We check if the user has credentials to access this information
        if(helper.isUserAdmin(user) || helper.isUserMentorInEvent(event, user._id) || helper.isUserVolunteerInEvent(event, user._id)){
            getEventMembersAfterUserIsAuthenticated(req, res, event, startTime);
        } else {
            //The champion also has access to this information, and we need to check if the user is a champion in the dojo
            Dojo.getDojoForChampionAuthentification(dojoId, function(err, dojo){
                if(err){
                    logger.error(`Error getting dojo for authenticating ${helper.getUser(req)}, for getting users registered for event ` +
                        `  (id=${eventId}) for ${keys.getUsersRegisteredForEventRoute}:` + err);
                    return res.sendStatus(500);
                }
                if(helper.isUserChampionInDojo(dojo, user._id)){
                    getEventMembersAfterUserIsAuthenticated(req, res, event, startTime);
                } else {
                    logger.error(`${helper.getUser(req)} tried to view event members without authorization`);
                    res.json({errors: keys.notAuthorizedError});
                }
            })
        }
    });
};

function getEventMembersAfterUserIsAuthenticated(req, res, event, startTime){
    let registeredUsers = extractRegisteredUsersListFromEvent(event);
    User.getUsersNames(registeredUsers, false, function(err, users){
        if(err){
            logger.error(`Error getting users names for ${helper.getUser(req)} for getting users registered for an event ` +
                ` (id=${event._id} from database` + err);
            return res.sendStatus(500);
        }
        let preparedEvent = prepareRegisteredUsersEvent(event, users);
        res.json({usersRegForEvent: preparedEvent});
        if(startTime){
            logger.debug(`EventsRoute: ${keys.getUsersRegisteredForEventRoute} time=${Date.now() - startTime.getTime()}ms`);
        }
    });

}

//Method that adds the names to the users registered to an event
function prepareRegisteredUsersEvent(event, registeredUsers){
    let mapOfUsersName = makeMapOfUserIdToName(registeredUsers);
    //We need to clone the event because the object received from the database is frozen
    event = JSON.parse(JSON.stringify(event));
    event.tickets.forEach(function(ticket){
        ticket.registeredMembers.forEach(function(regMember){
            let fullName = mapOfUsersName[regMember.userId];
            regMember.firstName = fullName.firstName;
            regMember.lastName = fullName.lastName;
        });
    });
    return event;
}

//MEthod that goes over every ticket in an event and adds the userId to a list it returns (resulting in a list of users
// registered for the event)
function extractRegisteredUsersListFromEvent(event){
    let ret = [];
    event.tickets.forEach(function(ticket){
        ticket.registeredMembers.forEach(function(regMember){
            ret.push(regMember.userId);
        })
    });
    return ret;
}

//Method for confirming or removing a user from an event
module.exports.confirmOrRemoveUserFromEvent = function(req, res){
    logger.debug(`Entering ${keys.confirmOrRemoveUserFromEventRoute}`);
    let user = req.user;
    let dojoId = req.body.dojoId;
    let eventId = req.body.eventId;
    let ticketId = req.body.ticketId;
    let userToAddOrRemoveId = req.body.userToAddOrRemoveId;
    let whichAction = req.body.whichAction;
    //This is the id of the registeredMember object in the array from the ticket in the event
    let regUserId = req.body.regUserId;
    let dojoName = req.body.dojoName;
    let data = {eventId:eventId, ticketId:ticketId, whichAction:whichAction, userToAddOrRemoveId:userToAddOrRemoveId,
        regUserId:regUserId, dojoName:dojoName};
    Event.getEventTickets(eventId, function(err, event){
        if(err){
            logger.error(`Error getting event by ${helper.getUser(req)}, for ${whichAction}  ` +
                ` user (id=${userToAddOrRemoveId}) for ${keys.confirmOrRemoveUserFromEventRoute}:` + err);
            return res.sendStatus(500);
        }
        //We check if the user has credentials to perform these actions
        if(helper.isUserAdmin(user) || helper.isUserMentorInEvent(event, user._id) || helper.isUserVolunteerInEvent(event, user._id)){
            confirmOrRemoveUserFromEvent(req, res, data);
        } else {
            //The champion also has access to this information, and we need to check if the user is a champion in the dojo
            Dojo.getDojoForChampionAuthentification(dojoId, function(err, dojo){
                if(err){
                    logger.error(`Error getting dojo for authenticating ${helper.getUser(req)}, for for ${whichAction} ` +
                        `  user (id=${userToAddOrRemoveId}) for ${keys.confirmOrRemoveUserFromEventRoute}::` + err);
                    return res.sendStatus(500);
                }
                if(helper.isUserChampionInDojo(dojo, user._id)){
                    confirmOrRemoveUserFromEvent(req, res, data);
                } else {
                    logger.error(`${helper.getUser(req)} tried to view ${whichAction} user without permission`);
                    res.json({errors: keys.notAuthorizedError});
                }
            })
        }
    });
};

function confirmOrRemoveUserFromEvent(req, res, data){
    Event.confirmOrRemoveUserFromEvent(data, function(err, event){
        if(err){
            logger.error(`Error ${data.whichAction} user (id=${data.userToAddOrRemoveId}) by ${helper.getUser(req)} ` +
                ` to event (id=${data.eventId}:` + err);
            return res.sendStatus(500);
        }
        //If the user was confirmed or removed from the event
        getEventMembersAfterUserIsAuthenticated(req, res, event);
        addNotificationToUserConfirmedOrRemovedFromAnEvent(event, data);
    });
}


function addNotificationToUserConfirmedOrRemovedFromAnEvent(event, data){
    let message = '';
    let ticketWithUser = helper.getUsersTicketFromEvent(event, data.userToAddOrRemoveId);
    let eventName = event.copyOfRecurrentEvent ? 'săptămânal': event.name;
    let eventDay = keys.daysOfWeek[event.startTime.getDay()];
    let eventDayOfMonth = event.startTime.getDate();
    let eventHours = helper.getPrettyHoursAndMinutes(event.startTime) + '-' + helper.getPrettyHoursAndMinutes(event.endTime);
    let eventMonth = keys.months[event.startTime.getMonth()];

    if(data.whichAction === keys.eventConfirmUser){
        //We need the ticket for the workshop name
        message = `Ai fost confirmat la evenimentul ${eventName} de la dojoul ${data.dojoName}, atelierul de ` +
            ` ${ticketWithUser.workshop}, ca și ${ticketWithUser.nameOfTicket},  de ${eventDay} ` +
            ` ${eventDayOfMonth} ${eventMonth} (${eventHours}).`
    } else if(data.whichAction === keys.eventRemoveUser){
        message = `Ai fost eliminat de la evenimentul ${eventName}, de la dojoul ${data.dojoName},` + `
                    de ${eventDay} ${eventDayOfMonth} ${eventMonth}.`;
    }
    let notification = helper.makeInfoNotification(message);
    User.addNotificationForUser(data.userToAddOrRemoveId, notification, function(err){
        if(err){
            logger.error(`Error adding notification to ${data.whichAction === keys.eventConfirmUser ? ' confirm ' : 'reject'}` +
                ` user (_id=${data.userToAddOrRemoveId}) to event (_id=${event._id}): ` + err );
        }
    });
}



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
                logger.silly(`===================================================================================`);
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
    event.tickets = convertEventSessionsToTickets(recurrentEvent.sessions);
    return event;
}

//Method that converts a list of sessions from the recurrent event to a list of tickets for the actual events
function convertEventSessionsToTickets(eventSessions){
    let ret = [];
    eventSessions.forEach(function(session){
        logger.silly(`session=${session}`);
        if(helper.isActive(session)){
            session.tickets.forEach(function(ticket){
                let cloneTicket = {};
                cloneTicket.registeredMembers = [];
                cloneTicket.workshop = session.workshop;
                cloneTicket.sessionId = session._id;
                cloneTicket.nameOfTicket = ticket.nameOfTicket;
                cloneTicket.numOfTickets = ticket.numOfTickets;
                cloneTicket.activeStatus = ticket.activeStatus;
                cloneTicket.typeOfTicket = ticket.typeOfTicket;
                ret.push(cloneTicket);
            });

        }
    });
    logger.silly(`ret=${JSON.stringify(ret)}`);
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
    return helper.getListOfFieldsFromListOfObjects(list, field);
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