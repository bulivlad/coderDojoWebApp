/**
 * Created by catap_000 on 5/21/2017.
 */

const keys = require('../static_keys/project_keys');

module.exports.isActive = function(eventOrSession){
    if(eventOrSession.activeStatus === keys.eventStatus[0]){ //If the event is active
        return true;
    } else {
        return false;
    }
};

//Method for displaying user information for logging
module.exports.getUser = function(req){
    if(req.user){
        return `user=(email=${req.user.email}, alias=${req.user.alias}, _id=${req.user._id}, authorizationLevel=${req.user.authorizationLevel})`;
    }
};

module.exports.printUser = function(user){
    if(user){
        return `user=(email=${user.email}, alias=${user.alias}, _id=${user._id}, authorizationLevel=${user.authorizationLevel})`;
    }
};

let isUserAdmin = module.exports.isUserAdmin = function(user){
    return user.authorizationLevel === keys.admin;
};

let isUserVolunteerInDojo = module.exports.isUserVolunteerInDojo = function(dojo, userId){
    if(dojo.volunteers){
        return (dojo.volunteers.indexOf(userId.toString()) > -1);
    } else {
        logger.debug(`dojo.volunteers is not defined, dojo ${JSON.stringify(dojo)}`);
    }
};

let isUserPendingVolunteerInDojo = module.exports.isUserPendingVolunteerInDojo = function(dojo, userId){
    if(dojo.pendingVolunteers){
        return (dojo.pendingVolunteers.indexOf(userId.toString()) > -1);
    } else {
        logger.debug(`dojo.pendingVolunteers is not defined, dojo ${JSON.stringify(dojo)}`);
    }
};

let isUserAttendeeInDojo = module.exports.isUserAttendeeInDojo = function(dojo, userId){
    if(dojo.attendees){
        return (dojo.attendees.indexOf(userId.toString()) > -1);
    } else {
        logger.debug(`dojo.attendees is not defined, dojo ${JSON.stringify(dojo)}`);
    }
};

let isUserParentInDojo = module.exports.isUserParentInDojo = function(dojo, userId){
    if(dojo.parents){
        return (dojo.parents.indexOf(userId.toString()) > -1);
    } else {
        logger.debug(`dojo.parents is not defined, dojo ${JSON.stringify(dojo)}`);
    }
};

let isUserMentorInDojo = module.exports.isUserMentorInDojo = function(dojo, userId){
    if(dojo.mentors){
        return (dojo.mentors.indexOf(userId.toString()) > -1);
    } else {
        logger.debug(`dojo.mentors is not defined, dojo ${JSON.stringify(dojo)}`);
    }
};

let isUserPendingMentorInDojo = module.exports.isUserPendingMentorInDojo = function(dojo, userId){
    if(dojo.pendingMentors){
        return (dojo.pendingMentors.indexOf(userId.toString()) > -1);
    } else {
        logger.debug(`dojo.pendingMentors is not defined, dojo ${JSON.stringify(dojo)}`);
    }
};

let isUserChampionInDojo = module.exports.isUserChampionInDojo = function(dojo, userId){
    if(dojo.champions){
        return (dojo.champions.indexOf(userId.toString()) > -1);
    } else {
        logger.debug(`dojo.champion is not defined, dojo ${JSON.stringify(dojo)}`);
    }
};

let isUserPendingChampionInDojo = module.exports.isUserPendingChampionInDojo = function(dojo, userId){
    if(dojo.pendingChampions){
        return (dojo.pendingChampions.indexOf(userId.toString()) > -1);
    } else {
        logger.debug(`dojo.pendingChampions is not defined, dojo ${JSON.stringify(dojo)}`);
    }
};

let isUserMemberOfDojo = module.exports.isUserMemberOfDojo = function(dojo, userId){
    return isUserAttendeeInDojo(dojo, userId) || isUserMentorInDojo(dojo, userId) ||
        isUserChampionInDojo(dojo, userId) || isUserParentInDojo(dojo, userId) || isUserVolunteerInDojo(dojo, userId);
};

let isUserPendingMemberOfDojo = module.exports.isUserPendingMemberOfDojo = function(dojo, userId){
    return isUserPendingChampionInDojo(dojo, userId) || isUserPendingMentorInDojo(dojo, userId) ||
        isUserPendingVolunteerInDojo(dojo, userId);
};

let isUserMemberOrPendingMemberOfDojo = module.exports.isUserMemberOrPendingMemberOfDojo = function(dojo, userId){
    return isUserMemberOfDojo(dojo, userId) || isUserPendingMemberOfDojo(dojo, userId);
};

//Method that returns true if the user is registered for an event as a mentor
module.exports.isUserMentorInEvent = function(event, userId){
    for(let i = 0; i < event.tickets.length; i++){
        let ticket = event.tickets[i];
        for(let j = 0; j < ticket.registeredMembers.length; j++){
            let regMember = ticket.registeredMembers[j];
            if(userId.toString() == regMember.userId){
                if(ticket.typeOfTicket === keys.typesOfTickets[1]){
                    return true;
                }
            }
        }
    }
};

//Method that returns true if the user is registered for an event as a volunteer
module.exports.isUserVolunteerInEvent = function(event, userId){
    for(let i = 0; i < event.tickets.length; i++){
        let ticket = event.tickets[i];
        for(let j = 0; j < ticket.registeredMembers.length; j++){
            let regMember = ticket.registeredMembers[j];
            if(userId.toString() == regMember.userId){
                if(ticket.typeOfTicket === keys.typesOfTickets[0]){
                    return true;
                }
            }
        }
    }
};

//Method for extracting a list of fields from a list of object (that have the fields)
module.exports.getListOfFieldsFromListOfObjects = function(list, field){
    let ret = [];
    list.forEach(function(item){
        ret.push(item[field]);
    });
    return ret;
};

//Method for determining if a child is the child of a user
//Arguments:
//     user is an object with a children list (_id's of the children)
//     child is an object with an _id field
module.exports.isUsersChild = function(user, child){
    //logger.silly('Entering isUsersChild');
    //logger.silly(`child_id=${child._id}`);
    if(user.children){
        //logger.silly(`user.children=${user.children}`);
        for(let i = 0; i < user.children.length; i++){
            let tmpChild = user.children[i];
            //logger.silly(`tmpChild=${tmpChild}`);
            if(tmpChild == child._id){//We need weak comparison because the two values are not of the same type
                return true;
            }
        }
    }
};

module.exports.makeInfoNotification = function(msg){
    let ret = {};
    ret.typeOfNot = keys.infoNotification;
    ret.data = {
        msg: msg
    };
    return ret;
};

//Returns the ticket the user is registered to
module.exports.getUsersTicketFromEvent = function(event, userId){
    for(let i = 0; i < event.tickets.length; i++){
        let ticket = event.tickets[i];
        for(let j = 0; j < ticket.registeredMembers.length; j++){
            let regMember = ticket.registeredMembers[j];
            if(regMember.userId == userId){
                return ticket;
            }
        }
    }
};

module.exports.getPrettyHoursAndMinutes = function(date){
    return date.getHours() + ':' + adjustOneNumberMinutes('' + date.getMinutes())
};

//Method for adding a 0 if the minutes are just one number (eg 2 to display 02)
function adjustOneNumberMinutes(number){
    return number.length == 1 ? '0' + number : number;
};

module.exports.resetNewNotifications = function(notifications){
    let ret = [];
    notifications.forEach(function(notification){
       let tem
    });
    return ret;
}


