/**
 * Created by Adina Paraschiv on 4/8/2017.
 */

const keys = require('../static_keys/project_keys');
const Dojo = require('../models/dojoModel');
const User = require('../models/userModel');
const Event = require('../models/eventModel');
const logger = require('winston');
const validator = require('validator');
const helper  = require('./helperController');

//Method for adding a new dojo (only the admin can do that)
module.exports.addDojo = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.addDojoRoute} by ${helper.getUser(req)}`);
    //First we check that the user trying to add the dojo is an administrator
    if(req.user.authorizationLevel === keys.admin){
        let dojo = req.body.dojo;
        let sanitizedDojo = sanitizeDojo(dojo);
        if(helper.areDojosEqual(dojo, sanitizedDojo)){
            let newDojo = new Dojo(sanitizedDojo);
            //We save the dojo to the database
            newDojo.save(function(err){
                if(err){
                    logger.error(`Error adding a dojo by ${helper.getUser(req)}:` + err);
                    return res.sendStatus(500);
                }
                //If the save was successful, we return a success message to the client.
                res.json({success: true});
            });
        } else {
            // If the dojo and the sanitized dojo are not equal, we send a sanitized error and the sanitizedDojo for the
            // user to decide if they agree with the sanitized version
            res.json({errors: keys.notSanitizedError, sanitizedDojo: sanitizedDojo});
        }

    } else {
        //If the user is not an administrator, we log this as an error, and respond with a not authorized error to the
        //client.
        logger.error(`${helper.getUser(req)} tried to add a dojo while not authorized to do so`);
        res.json({errors: keys.notAuthorizedError});
    }
};

//Method for deleting a dojo (only the admin can do that)
module.exports.deleteDojo = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.deleteDojoRoute} by ${helper.getUser(req)}`);
    //First we check that the user trying to add the dojo is an administrator
    if(req.user.authorizationLevel === keys.admin){
        let dojoId = req.body.dojoId;
        logger.silly(`DojoId to delete: (${dojoId})`);
        //We save the dojo to the database
        Dojo.remove({_id: dojoId}, function(err){
            if(err){
                logger.error(`Error deleting dojo (_id=${dojoId}) by ${helper.getUser(req)}:` + err);
                return res.sendStatus(500);
            }
            //If the save was successful, we return a success message to the client.
            res.json({success: true});
        });
    } else {
        //If the user is not an administrator, we log this as an error, and respond with a not authorized error to the
        //client.
        logger.error(`${helper.getUser(req)} tried to add a dojo while not authorized to do so`);
        res.json({errors: keys.notAuthorizedError});
    }
};

//Route for editing an existing dojo (only the admin and champion can do that)
module.exports.editDojo = function(req, res){
    let user = req.user;
    let modifiedDojo = req.body.dojo;

    let sanitizedDojo = sanitizeDojo(modifiedDojo);
    if(helper.areDojosEqual(modifiedDojo, sanitizedDojo)){
        //We get the dojos from the database to check the user's credentials
        Dojo.getDojoForInternalAuthentication(modifiedDojo._id, function(err, dojo){
            if(err){
                logger.error(`Error getting dojo by ${helper.getUser(req)}, for  ${keys.editDojoRoute}:` + err);
                return res.sendStatus(500);
            }
            //Checking if the user has permission to edit the dojo (is champion in dojo or admin)
            if(isUserAdmin(user) || isUserChampionInDojo(dojo, user._id)){
                Dojo.updateDojo(modifiedDojo, function(err){
                    if(err){
                        logger.error(`Error adding a dojo by ${helper.getUser(req)}:` + err);
                        return res.sendStatus(500);
                    }
                    res.json({success: true});
                });
            } else {
                //If the user is not champion of dojo or admin, we log it, and we send back an unauthorized error
                logger.error(`${helper.getUser(req)} tried to edit a dojo (id=${modifiedDojo._id}) while not authorized to do so`);
                res.json({errors: keys.notAuthorizedError});
            }
        });
    } else {
        // If the dojo and the sanitized dojo are not equal, we send a sanitized error and the sanitizedDojo for the
        // user to decide if they agree with the sanitized version
        res.json({errors: keys.notSanitizedError, sanitizedDojo: sanitizedDojo});
    }
};

//Method that returns the upcoming dojos for users (or myDojos, if a flag is set)
module.exports.getDojos = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.getDojosRoute}`);
    //Go to the database to get all dojos
    Dojo.getDojos(function(err, dojos){
        if (err){
            logger.error(`Problems retrieving dojos for ${keys.getDojosRoute} from database : ` + err);
            return res.sendStatus(500);
        }
        //Upon success we return the dojos
        res.json({dojos:dojos});
    });
};

//Method for getting user's dojos
module.exports.getMyDojos = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.getMyDojosRoute}`);
    let user = req.user;
    //Go to the database to get all dojos
    let getMyDojos = Dojo.getUsersDojos;
    if(helper.isUserAdmin(user)){
        //If the user is admin he calls get admins dojos, withc return all the dojos
        getMyDojos = Dojo.getAdminsDojos;
    }

    getMyDojos(user._id, function(err, dojos){
        if (err){
            logger.error(`Problems retrieving dojos by ${helper.getUser(req)} for ${keys.getMyDojosRoute} from database: ` + err);
            return res.sendStatus(500);
        }
        //We filter the dojos so only the ones where the user is a member remain (or all if the user is admin).
        res.json({userId: user._id, dojos:dojos});
    });
};

//Method for getting user's child's dojos
module.exports.getMyChildsDojos = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.getMyChildsDojosRoute}`);
    let user = req.user;
    let childId = req.body.childId;
    //First we check if the current user is a parent of the child
    if(helper.isUsersChild(user, {_id:childId})){
        //Go to the database to get all dojos
        Dojo.getUsersDojos(childId, function(err, dojos){
            if (err){
                logger.error(`Problems retrieving dojos by ${helper.getUser(req)}  for ${keys.getMyChildsDojosRoute} from database: ` + err);
                return res.sendStatus(500);
            }
            res.json({childId: childId, dojos:dojos});
        });
    } else {
        //If the user is not the parent of the child (the user for which the dojos were requested) we sent a wrongUserError back
        logger.error(`${helper.getUser(req)} is not parent of child(id=${childId}`);
        res.json({errors:keys.wrongUserError});
    }
};

//Method that returns a dojo for an user that is not authenticated
module.exports.getDojo = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.getDojoRoute}`);
    let dojoId = req.body.dojoId;
    //Get a single dojo from the database, with the basic fields
    Dojo.getDojo(dojoId, function(err, dojo){
        //We need to copy it because the object received from the database is frozen
        dojo = JSON.parse(JSON.stringify(dojo));
        if (err){
            logger.error(`Problems retrieving dojo by ${helper.getUser(req)}  for ${keys.getDojoRoute} from database: ` + err);
            return res.sendStatus(500);
        }
        //logger.silly(`before dojo=${JSON.stringify(dojo)}`);
        let adjustedRecEvents = adjustRecurrentEventsForRegularUsers(dojo.recurrentEvents);
        dojo.recurrentEvents = adjustedRecEvents;
        res.json({dojo:dojo});
    });
};

//Method that returns a dojo for an authenticated user
module.exports.getAuthDojo = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.getAuthDojoRoute}`);
    let user = req.user;
    let dojoId = req.body.dojoId;
    //Get a single dojo from the database, with all the fields
    Dojo.getAuthDojo(dojoId, function(err, dojo){
        if (err){
            logger.error(`Problems retrieving dojo by ${helper.getUser(req)}  for ${keys.getAuthDojoRoute} from database: ` + err);
            return res.sendStatus(500);
        }
        //Next we filter the dojos, based on user permisions. Flags are added to inform the client app which actions the
        //client app can perform (ex: can edit dojos, more info in the method).
        dojo = prepareDojoBasedOnUserPermisions(user, dojo);
        res.json({dojo:dojo});
    });
};

//Method for becoming member of dojo
module.exports.becomeMemberOfDojo = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.becomeMemberOfDojoRoute} for ${helper.getUser(req)}`);
    let dojoId = req.body.dojoId;
    //First we get the dojos and check if the user is not a member or a pending member of this dojo (fail safe)
    Dojo.getDojoForInternalAuthentication(dojoId, function(err, dojo){
        if (err){
            logger.error(`Problems retrieving dojo by ${helper.getUser(req)}  for ${keys.becomeMemberOfDojoRoute} from database: ` + err);
            return res.sendStatus(500);
        }
        if( isUserMemberOrPendingMemberOfDojo(dojo, req.user._id) ){
            //IF the user is already a member, we send a userAlreadyJoined error
            res.json({errors: keys.userAlreadyJoinedDojoError});
            logger.error(`${helper.getUser(req)} already has joined dojo ${JSON.stringify(dojo)}`);

        } else {
            //if user is not already joined or pending a dojo he/she becomes a member or a pendingJoining is added
            becomeMemberOfDojo(req, res);
        }
    })


};

//Helper method for adding a user to a dojo
function becomeMemberOfDojo(req, res){
    let dojoId = req.body.dojoId;
    let whatMember = req.body.whatMember;
    let listToUpdate = {};
    //We determine what king of member the user wants to be, and construct the adding query based on that
    if(whatMember === keys.parent){
        listToUpdate = {$addToSet: {parents: req.user._id}};
    } else if(whatMember === keys.attendee){
        listToUpdate = {$addToSet: {attendees: req.user._id}};
    } else if(whatMember === keys.mentor){
        listToUpdate = {$addToSet: {pendingMentors: req.user._id}};
    } else if(whatMember === keys.champion){
        listToUpdate = {$addToSet: {pendingChampions: req.user._id}};
    } else if(whatMember === keys.volunteer){
        listToUpdate = {$addToSet: {pendingVolunteers: req.user._id}};
    } else {
        logger.error(`Request unknown by ${helper.getUser(req)}`);
        return res.sendStatus(500);
    }
    logger.silly(`dojoId=${dojoId},whatMember:${whatMember}, listToUpdate:${JSON.stringify(listToUpdate)}`);
    //We update the dojos with the query constructed above
    Dojo.findOneAndUpdate(
        {_id: dojoId},
        listToUpdate,
        function(err, dojo){
            if(err){
                logger.error(`Error joining dojo by ${helper.getUser(req)}:` + err);
                return res.sendStatus(500);
            }
            res.json({success: true});
            // After the user has successfully joined the dojo, we add his children to the dojo as attendees (only parents
            // join automatically)
            if(whatMember === keys.parent){
                addUsersChildrenToDojo(req.user, dojo);
            }
        });
}

//Method by which a use leaves a dojo
module.exports.leaveDojo = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.leaveDojoRoute} for ${helper.getUser(req)}`);
    let dojoId = req.body.dojoId;
    // We go at this in a brute force manner. Instead of determining what kind of member the user was, we just remove
    // the user from every userType array there is in the database.
    Dojo.findOneAndUpdate(
        {_id: dojoId},
        {$pull:{mentors:req.user._id, pendingMentors:req.user._id, volunteers:req.user._id,
            pendingVolunteers:req.user._id, champions:req.user._id, pendingChampions:req.user._id,
            parents:req.user._id, attendees:req.user._id}},
        function(err, dojo){
            if(err){
                logger.error(`Error leaving dojo by ${helper.getUser(req)}:` + err);
                return res.sendStatus(500);
            }
            res.json({success: true});

        })

};

//Method that gets summary info about members for a dojo
module.exports.getUsersForMember = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.getUsersForMember} for ${helper.getUser(req)}`);
    let user = req.user;
    let dojoId = req.body.dojoId;
    let typeOfUsers = req.body.typeOfUsers;
    Dojo.getDojoForInternalAuthentication(dojoId, function(err, dojo){
        if (err){
            logger.error(`Error getting dojo for getting members for ${helper.getUser(req)}, for dojo(${dojoId}):` + err);
            return res.sendStatus(500);
        }
        logger.silly('dojoToSearh:', JSON.stringify(dojo));
        //We check that the user has credentials to make the request
        let isUserAuthorized = isUserAdmin(user);

        if(typeOfUsers === keys.parents || typeOfUsers === keys.attendees ||
            typeOfUsers === keys.volunteers || typeOfUsers === keys.mentors ||
            typeOfUsers === keys.champions){
            if(isUserMemberOfDojo(dojo, user._id)){
                isUserAuthorized = true;
            }
        } else if (typeOfUsers === keys.pendingMentors|| typeOfUsers === keys.pendingChampions ||
            typeOfUsers === keys.pendingVolunteers){
            if(isUserChampionInDojo(dojo, user._id)){
                isUserAuthorized = true;
            }
        }
        if(isUserAuthorized){
            User.getUsersForMember(dojo[typeOfUsers], function(err, users){
                if (err){
                    logger.error(`Error getting members for ${helper.getUser(req)}, for dojo(${dojoId}):` + err);
                    return res.sendStatus(500);
                }
                res.json({users: users});
            })
        } else {
            logger.error(`${helper.getUser(req)} tried to get members of dojo (${dojoId}) while not authorized`);
            res.json({errors: keys.notAuthorizedError});
        }
    })
};

//Method that gets full info about a user in a dojo
module.exports.getDetailedUserForMember = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.getDetailedUserForMemberRoute} for ${helper.getUser(req)}`);
    let userToSearchForId = req.body.userId;
    let dojoToSearchInId = req.body.dojoId;
    let user = req.user;
    Dojo.getDojoForInternalAuthentication(dojoToSearchInId, function(err, dojo){
        if (err){
            logger.error(`Error getting dojo for for ${helper.getUser(req)}, for ${keys.getDetailedUserForMemberRoute}:` + err);
            return res.sendStatus(500);
        }
        // We determine if the user is authorized for the action
        if(isUserAdmin(user) || isUserChampionInDojo(dojo, user._id)){
            //After we determined that the user making the inquiry is authorized, we determine if the user searched for
            //is still part of the dojo (pending or already a member).
            if (isUserMemberOrPendingMemberOfDojo(dojo, userToSearchForId)){
                User.getDetailedUserForMember(userToSearchForId, function(err, user){
                    if (err){
                        logger.error(`Error finding user (userId=${userToSearchForId}) for ${helper.getUser(req)},
                                        for getting member info:` + err);
                        return res.sendStatus(500);
                    }
                    res.json({user:user});
                })
            } else {
                logger.error(`User id=${userToSearchForId} is no longer part of the dojo`);
                res.json({errors: keys.notAuthorizedError});
            }
        } else {
            logger.error(`${helper.getUser(req)} tried to get info on member (userId=${userToSearchForId}) of dojo (${dojoToSearchInId})
                            while not authorized`);
            res.json({errors: keys.notAuthorizedError});
        }

    });
};

//Method for rejecting a users application to become a member for a dojo
module.exports.rejectPendingMember = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.rejectPendingMemberRoute} for ${helper.getUser(req)}`);
    let userToRejectId = req.body.userId;
    let dojoId = req.body.dojoId;
    let user = req.user;
    Dojo.getDojoForInternalAuthentication(dojoId, function(err, dojo){
        if (err){
            logger.error(`Error getting dojo for for ${helper.getUser(req)}, for rejecting member id=${userToRejectId}:` + err);
            return res.sendStatus(500);
        }
        // We determine if the user is authorized for the action
        if(isUserAdmin(user) || isUserChampionInDojo(dojo, user._id)){
            //Now we check if the user is pending for mentor, volunteer or champion
            let typeOfUser = null;
            let dojoModifications = null;
            if(isUserPendingChampionInDojo(dojo, userToRejectId)){
                typeOfUser = 'campion';
                dojoModifications = {$pull: {pendingChampions: userToRejectId}};
            } else if (isUserPendingMentorInDojo(dojo, userToRejectId)){
                typeOfUser = 'mentor';
                dojoModifications = {$pull: {pendingMentors: userToRejectId}};
            } else if (isUserPendingVolunteerInDojo(dojo, userToRejectId)){
                typeOfUser = 'voluntar';
                dojoModifications = {$pull: {pendingVolunteers: userToRejectId}};
            }
            //We update the dojo by removing the user from members
            if(typeOfUser){
                Dojo.findOneAndUpdate(
                    {_id: dojoId},
                    dojoModifications,
                    function(err, dojo){
                        if(err){
                            logger.error(`Error updating dojo while rejecting pending member in dojo by ${helper.getUser(req)}:` + err);
                            return res.sendStatus(500);
                        }
                        if(dojo){
                            //After removing the user from pending members, we send him/her a notification of this
                            let notification = {};
                            notification.typeOfNot = keys.infoNotification;
                            notification.data = {
                                msg: `Aplicația ta ca ${typeOfUser} al dojoului ${dojo.name}, a fost respinsă.`
                            };
                            User.addNotificationForUser(userToRejectId, notification, function(err){
                                if(err){
                                    logger.error(`Error adding notification for user id=${userToRejectId}`);
                                }
                            });
                            res.json({success: true});

                        } else {
                            logger.error(`Dojo (id=${dojoId}) not found by: ${helper.getUser(req)}, while rejecting pending member`);
                            return res.sendStatus(500);
                        }
                    })
            } else {
                res.json({success: true});
            }
        } else {
            logger.error(`${helper.getUser(req)} tried to reject pending member (userId=${userToRejectId}) of dojo (${dojoId})
                            while not authorized`);
            res.json({errors: keys.notAuthorizedError});
        }
    });
};

//Method for accepting a users application to become a member for a dojo
module.exports.acceptPendingMember = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.acceptPendingMemberRoute} for ${helper.getUser(req)}`);
    let userToAcceptId = req.body.userId;
    let dojoId = req.body.dojoId;
    let user = req.user;
    Dojo.getDojoForInternalAuthentication(dojoId, function(err, dojo){
        if (err){
            logger.error(`Error getting dojo for for ${helper.getUser(req)}, for accepting member id=${userToAcceptId}:` + err);
            return res.sendStatus(500);
        }
        // We determine if the user is authorized for the action
        if(isUserAdmin(user) || isUserChampionInDojo(dojo, user._id)){
            //Now we check if the user is pending for mentor, volunteer or champion
            let typeOfUser = null;
            let dojoModifications = null;
            if(isUserPendingChampionInDojo(dojo, userToAcceptId)){
                typeOfUser = 'campion';
                dojoModifications = {$pull: {pendingChampions: userToAcceptId}, $addToSet: {champions: userToAcceptId}};
            } else if (isUserPendingMentorInDojo(dojo, userToAcceptId)){
                typeOfUser = 'mentor';
                dojoModifications = {$pull: {pendingMentors: userToAcceptId},  $addToSet: {mentors: userToAcceptId}};
            } else if (isUserPendingVolunteerInDojo(dojo, userToAcceptId)){
                typeOfUser = 'voluntar';
                dojoModifications = {$pull: {pendingVolunteers: userToAcceptId}, $addToSet: {volunteers: userToAcceptId}};
            }
            //We update the dojo by removing the user from pending members and adding him/her to the members
            if(typeOfUser){
                Dojo.findOneAndUpdate(
                    {_id: dojoId},
                    dojoModifications,
                    function(err, dojo){
                        if(err){
                            logger.error(`Error updating dojo while accepting pending member in dojo by ${helper.getUser(req)}:` + err);
                            return res.sendStatus(500);
                        }
                        if(dojo){
                            //After removing the user from pending members, we send him/her a notification of this
                            let notification = {};
                            notification.typeOfNot = keys.infoNotification;
                            notification.data = {
                                msg: `Aplicația ta ca ${typeOfUser} al dojoului ${dojo.name}, a fost acceptată.`
                            };
                            User.addNotificationForUser(userToAcceptId, notification, function(err){
                                if(err){
                                    logger.error(`Error adding notification for user id=${userToAcceptId}`);
                                }
                            });
                            res.json({success: true});
                            //After the user was accepted in the dojo, we add the user's children to the dojo
                            User.getUsersAndHisChildren(userToAcceptId, function(err, addedUser){
                                if(err){
                                    logger.error(`Error getting user and his children (_id=${userToAcceptId} by ` +
                                        ` ${helper.getUser(user)} for adding user's children this just joined dojo (_id=${dojoId}`);
                                    return;
                                }
                                addUsersChildrenToDojo(addedUser, dojo);
                            });

                        } else {
                            logger.error(`Dojo (id=${dojoId}) not found by: ${helper.getUser(req)}, while accepting pending member`);
                            return res.sendStatus(500);
                        }
                    })
            } else {
                res.json({success: true});
            }
        } else {
            logger.error(`${helper.getUser(req)} tried to accept pending member (userId=${userToAcceptId}) of dojo (${dojoId})
                            while not authorized`);
            res.json({errors: keys.notAuthorizedError});
        }
    });
};

//Method that returns the user's role in a dojo
module.exports.getUserRoleInDojo = function(dojo, userId){
    if(isUserMentorInDojo(dojo, userId)){
        return keys.typesOfTickets[1];
    } else if(isUserVolunteerInDojo(dojo, userId)){
        return keys.typesOfTickets[0];
    } else if(isUserAttendeeInDojo(dojo, userId)){
        return keys.typesOfTickets[2];
    }
};

//Method for adding an event to a dojo
module.exports.addEventToDojo = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.addEventToDojoRoute} for ${helper.getUser(req)}`);
    let user = req.user;
    let dojoId = req.body.dojoId;
    let event = req.body.event;
    let sanitizedEvent = helper.sanitizeEvent(event);
    if(helper.areEventsEqual(event, sanitizedEvent)){
        Dojo.getDojoForChampionAuthentification(dojoId, function(err, dojo){
            if(err){
                logger.error(`Error getting dojo for ${helper.getUser(req)}, for authenticating him/her for ` +
                    `adding and event to a dojo (_id=${dojoId}):` + err);
                return res.sendStatus(500);
            }
            if(helper.isUserAdmin(user) || isUserChampionInDojo(dojo, user._id)){
                let covertedEvent = helper.convertClientEventToUniqueEvent(sanitizedEvent, dojo._id.toString());
                Event.createEvent(covertedEvent, function(err){
                    if(err){
                        logger.error(`Error saving event by ${helper.getUser(req)}, for creating event for dojo (_id=${dojoId})` + err);
                        return res.sendStatus(500);
                    }
                    res.json({success:true});
                });

            } else {
                logger.error(`User ${helper.getUser(req)} tried to add an event to dojo (_id=${dojoId}) while not authorized to do so)`);
                res.json({errors: keys.notAuthorizedError});
            }
        })
    } else {
        //If the sanitization has modified the event, we inform the user
        res.json({errors: keys.notSanitizedError, sanitizedEvent: sanitizedEvent});
    }
};

//Method for adding user's children to the dojo the user just joined
//Arguments
//  user - user from the session
//  dojo - the fields required are the _id (for searching) and the name for logging
let addUsersChildrenToDojo = module.exports.addUsersChildrenToDojo = function(user, dojo){
    logger.silly(`Entering addUsersChildrenToDojo()`);
    let usersChildren = user.children;
    let dojoId = dojo._id;
    if(usersChildren.length > 0){
        //The second argument is a flag to only search for children that are minors
        User.getUsersBirthdate(usersChildren, true, function(err, usersMinorChildren){
            if(err){
                logger.error(`Problems retrieving users children under 18 by ${helper.getUser(user)} for adding his/her ` +
                    `children to his/her dojo _id=${dojoId}: ` + err);
            }
            if(usersMinorChildren.length > 0){
                //The list of user's children is a list of objects (_id: xxxxxx), we need a list of ids, so we convert it
                let childrenToAddToDojo = helper.getListOfFieldsFromListOfObjects(usersMinorChildren, '_id');
                Dojo.addUsersChildrenToDojo(childrenToAddToDojo, dojoId, function(err){
                    if(err){
                        logger.error(`Problems adding user's children to the dojo _id=${dojoId} by ${helper.getUser(user)}` +
                            ` for adding his/her children to his/her dojos: ` + err);
                        return;
                    }
                    logger.silly(`Children added to dojo (_id=${dojoId}, name=${dojo.name})`)
                });
            }
        });
    }
};

//Method for getting a dojo from a list of dojos
function getDojoFromDojos(dojoId, dojos){
    for(var i = 0; i < dojos.length; i++){
        var curDojo = dojos[i];
        if(curDojo._id == dojoId){
            return curDojo;
        }
    }
}

//Method used when filtering dojos for myDojos
function filterDojosForMyDojos(user, dojos){
    let dojosRet = [];
    if(dojos){
        dojos.forEach(function(dojo){
            logger.silly(`=======================================`);
            logger.silly(`DojoName: ${dojo.name}, DojoId=${dojo._id}`);
            //We determine if the user is a member of the dojos (or admin)
            if(isUserMemberOfDojo(dojo, user._id)  ||
                isUserAdmin(user)){
                //These field are not required to the app after it is determined if the user is part of the dojo
                //so are removed for performance and privacy reasons.
                dojo.champions = undefined;
                dojo.mentors = undefined;
                dojo.parents = undefined;
                dojo.attendees = undefined;
                dojo.volunteers = undefined;
                dojosRet.push(dojo);
                logger.silly(`Dojo added to my dojos`);
            }
            logger.silly(`=======================================`);

        })
    }
    return dojosRet;
}

//Method that filters the fields for a dojo based on user permissions
//Flags in method"
// showMembers: this is for the show members button in the dojos view (only members have access to other members)
// hasJoined: this user has joined the dojo (different form isPendingMember)
// canEditDojo: this user can edit a dojos (champion and admin)
// canAddMembers: this user can accept member requests for joining
// canAddEvent: can create an event for the dojo (champion and admin)
// isAdmin: the user is the administrator of the site
// isPendingJoining: the user has requested membership, and is the invitation is pending
function prepareDojoBasedOnUserPermisions(user, dojo){
    //For security reasons the returned object is a new one, with the fields deemed appropriate added to it (this is done
    // as a fail safe).
    let dojoRet = {};
    if(dojo){
        if(user){
            logger.silly(`=======================================`);
            logger.silly(`DojoName: ${dojo.name}, DojoId=${dojo._id}`);
            //logger.silly(`Dojo=${JSON.stringify(dojo)}`);
            if(isUserMentorInDojo(dojo, user._id)){
                //We have determined that the user is a mentor in this dojos
                logger.silly(`User is a mentor in this dojo`);

                dojoRet[keys.hasJoined] = true;
                dojoRet[keys.showMembers] = true;
                dojoRet[keys.mentor] = true;

            }
            else if(isUserVolunteerInDojo(dojo, user._id)){
                logger.silly(`User is a Volunteer or attendee or parent in this dojo`);

                dojoRet[keys.hasJoined] = true;
                dojoRet[keys.showMembers] = true;
                dojoRet[keys.volunteer] = true;
            }
            else if(isUserAttendeeInDojo(dojo, user._id)){
                logger.silly(`User is a Volunteer or attendee or parent in this dojo`);

                dojoRet[keys.hasJoined] = true;
                dojoRet[keys.showMembers] = true;
                dojoRet[keys.attendee] = true;
            }
            else if(isUserParentInDojo(dojo, user._id) ){
                logger.silly(`User is a Volunteer or attendee or parent in this dojo`);

                dojoRet[keys.hasJoined] = true;
                dojoRet[keys.showMembers] = true;
                dojoRet[keys.parent] = true;
            }
            else if (isUserChampionInDojo(dojo, user._id)){
                logger.silly(`User is champion`);

                dojoRet.recurrentEvents = dojo.recurrentEvents;

                dojoRet[keys.canEditDojo] = true;
                dojoRet[keys.canAcceptMembers] = true;
                dojoRet[keys.canAddEvent] = true;
                dojoRet[keys.hasJoined] = true;
                dojoRet[keys.showMembers] = true;
                dojoRet[keys.champion] = true;
            } else if(isUserAdmin(user)){
                logger.silly(`User is admin`);
                dojoRet.recurrentEvents = dojo.recurrentEvents;

                dojoRet[keys.canEditDojo] = true;
                dojoRet[keys.canDeleteDojo] = true;
                dojoRet[keys.canAcceptMembers] = true;
                dojoRet[keys.canAddEvent] = true;
                dojoRet[keys.hasJoined] = true;
                dojoRet[keys.admin] = true;
                dojoRet[keys.showMembers] = true;
                dojoRet[keys.admin] = true;
            } else if(isUserPendingChampionInDojo(dojo, user._id)){
                logger.silly('user is pending champion');
                dojoRet[keys.isPendingJoining] = true;
                dojoRet[keys.pendingChampion] = true;
            } else if(isUserPendingMentorInDojo(dojo, user._id)){
                logger.silly('user is pending mentor');
                dojoRet[keys.isPendingJoining] = true;
                dojoRet[keys.pendingMentor] = true;
            } else if(isUserPendingVolunteerInDojo(dojo, user._id)){
                logger.silly('user is pending volunteer');
                dojoRet[keys.isPendingJoining] = true;
                dojoRet[keys.pendingVolunteer] = true
            }
            logger.silly(`=======================================`);
        }
        // Adding the default fields that every dojo user can see
        dojoRet.name = dojo.name;
        dojoRet.address = dojo.address;
        dojoRet.latitude = dojo.latitude;
        dojoRet.longitude = dojo.longitude;
        dojoRet.email = dojo.email;
        dojoRet.statuses = dojo.statuses;
        dojoRet.schedules = dojo.schedules;
        dojoRet.facebook = dojo.facebook;
        dojoRet.twitter = dojo.twitter;
        dojoRet.requirements = dojo.requirements;
        dojoRet.dojoEvents = dojo.dojoEvents;
        dojoRet.pictureUrl = dojo.pictureUrl;
        dojoRet._id = dojo._id;
        //If the recurrent events have not been added (only champions and admins get them by default), we add the schedule
        //so it is displayed in the dojo info
        if(!dojoRet.recurrentEvents){
            dojoRet.recurrentEvents = adjustRecurrentEventsForRegularUsers(dojo.recurrentEvents);
        }
    }
    return dojoRet;
}

//We only add the schedule of active events
function adjustRecurrentEventsForRegularUsers(recurrentEvents){
    let ret = [];
    recurrentEvents.forEach(function(recEvent){
        if(helper.isActive(recEvent)){
            let simpleRecEvent = {startHour: recEvent.startHour, endHour: recEvent.endHour, startMinute: recEvent.startMinute,
                endMinute: recEvent.endMinute, day: recEvent.day};
            ret.push(simpleRecEvent);
        }
    });
    return ret;
}

function isUserAdmin(user){
    return helper.isUserAdmin(user);
}

function isUserVolunteerInDojo(dojo, userId){
    return helper.isUserVolunteerInDojo(dojo, userId);
}

function isUserPendingVolunteerInDojo(dojo, userId){
    return helper.isUserPendingVolunteerInDojo(dojo, userId);
}

function isUserAttendeeInDojo(dojo, userId){
    return helper.isUserAttendeeInDojo(dojo, userId);
}

function isUserParentInDojo(dojo, userId){
    return helper.isUserParentInDojo(dojo, userId);
}

function isUserMentorInDojo(dojo, userId){
    return helper.isUserMentorInDojo(dojo, userId);
}

function isUserPendingMentorInDojo(dojo, userId){
    return helper.isUserPendingMentorInDojo(dojo, userId);
}

function isUserChampionInDojo(dojo, userId){
    return helper.isUserChampionInDojo(dojo, userId);
}

function isUserPendingChampionInDojo(dojo, userId){
    return helper.isUserPendingChampionInDojo(dojo, userId);
}

function isUserMemberOfDojo(dojo, userId){
    return helper.isUserMemberOfDojo(dojo, userId);
}

function isUserPendingMemberOfDojo(dojo, userId){
    return helper.isUserPendingMemberOfDojo(dojo, userId);
}

function isUserMemberOrPendingMemberOfDojo(dojo, userId){
    return helper.isUserMemberOrPendingMemberOfDojo(dojo, userId);
}

//Method for sanitizing the fields of a dojo
function sanitizeDojo(dojo){
    //Cloning the dojo
    let ret = JSON.parse(JSON.stringify(dojo));

    //Sanitizing the name
    let sanitName = validator.trim(dojo.name);
    if(sanitName.length > 50){
        sanitName = sanitName.substring(0, 50);
    }
    sanitName = validator.whitelist(sanitName, helper.eventWhiteListNames);
    ret.name = sanitName;

    //Sanitizing the adress
    let sanitAdress = validator.trim(dojo.address);
    if(sanitAdress.length > 100){
        sanitAdress = sanitAdress.substring(0, 100);
    }
    sanitAdress = validator.whitelist(sanitAdress, helper.eventWhiteListNames);
    ret.address = sanitAdress;

    //Sanitizing the email
    let sanitEmail = validator.trim(dojo.email);
    sanitEmail = validator.whitelist(sanitEmail, helper.eventWhiteListNames);
    ret.email = sanitEmail;

    //Sanitizing the statuses
    let sanitStatuses = ret.statuses.map(function(status){
        return validator.whitelist(status, helper.eventWhiteListNames);
    });
    ret.statuses = sanitStatuses;

    //Sanitizing the requirements
    let sanitRequirements = ret.requirements.map(function(requirement){
        return validator.whitelist(requirement, helper.eventWhiteListNames);
    });
    ret.requirements = sanitRequirements;

    //Sanitizing the recurrent events
    ret.recurrentEvents = helper.sanitizeEvents(ret.recurrentEvents);

    return ret;
}





