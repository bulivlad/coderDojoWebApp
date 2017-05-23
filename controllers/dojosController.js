/**
 * Created by Adina Paraschiv on 4/8/2017.
 */

const keys = require('../static_keys/project_keys');
const Dojo = require('../models/dojoModel');
const User = require('../models/userModel');
const UserController = require('../controllers/usersController')
const logger = require('winston');
const validator = require('validator');
const helper  = require('./helperController');


//Method for adding a new dojo (only the admin can do that)
module.exports.addDojo = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.addDojoRoute} by ${helper.helper.getUser(req)}`);
    //First we check that the user trying to add the dojo is an administrator
    if(req.user.authorizationLevel === keys.admin){
        let dojo = req.body.dojo;
        logger.silly(`Dojo to save before sanitize: ${JSON.stringify(dojo)}`);
        dojo = sanitizeDojo(dojo);
        logger.silly(`Dojo to save after sanitize: ${JSON.stringify(dojo)}`);
        let newDojo = new Dojo(dojo);
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
    logger.debug(`Entering DojosRoute: ${keys.editDojoRoute} by ${helper.getUser(req)}`);
    let user = req.user;
    let modifiedDojo = req.body.dojo;
    logger.silly(`Modified dojo before sanitize: ${JSON.stringify(modifiedDojo)}`);
    modifiedDojo = sanitizeDojo(modifiedDojo);
    logger.silly(`Modified dojo after sanitize: ${JSON.stringify(modifiedDojo)}`);
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
};

//Method that returns the upcoming dojos for users (or myDojos, if a flag is set)
module.exports.getDojos = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.getDojosRoute}`);
    //Go to the database to get all dojos
    Dojo.getDojos(false, function(err, dojos){
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
    Dojo.getDojos(true, function(err, dojos){
        if (err){
            logger.error(`Problems retrieving dojos by ${helper.getUser(req)} for ${keys.getMyDojosRoute} from database: ` + err);
            return res.sendStatus(500);
        }
        //We filter the dojos so only the ones where the user is a member remain (or all if the user is admin).
        dojos = filterDojosForMyDojos(user, dojos);
        res.json({userId: user._id, dojos:dojos});
    });
};

//Method for getting user's child's dojos
module.exports.getMyChildsDojos = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.getMyChildsDojosRoute}`);
    let user = req.user;
    let childId = req.body.childId;
    //First we check if the current user is a parent of the child
    if(UserController.isUsersChild(user, {_id:childId})){
        //Go to the database to get all dojos
        Dojo.getDojos(true, function(err, dojos){
            if (err){
                logger.error(`Problems retrieving dojos by ${helper.getUser(req)}  for ${keys.getMyChildsDojosRoute} from database: ` + err);
                return res.sendStatus(500);
            }
            //We filter the dojos so only the childs dojo's are sent
            dojos = filterDojosForMyDojos({_id:childId}, dojos);
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
        function(err){
            if(err){
                logger.error(`Error joining dojo by ${helper.getUser(req)}:` + err);
                return res.sendStatus(500);
            }
            res.json({success: true});
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
            pendingVolunteers:req.user._id, champion:req.user._id, pendingChampions:req.user._id,
            parents:req.user._id, attendees:req.user._id}},
        function(err, dojo){
            if(err){
                logger.error(`Error leaving dojo by ${helper.getUser(req)}:` + err);
                return res.sendStatus(500);
            }
            res.json({success: true});

        })

};

//Method that gets summary info about members for a dojo xxxxxxxx(aici am ramas)
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

        if(typeOfUsers === 'parents' || typeOfUsers === 'attendees' || typeOfUsers === 'volunteers' ||
            typeOfUsers === 'mentors' || typeOfUsers === 'champions'){
            if(isUserMemberOfDojo(dojo, user._id)){
                isUserAuthorized = true;
            }
        } else if (typeOfUsers === 'pendingMentors' || typeOfUsers === 'pendingChampions' ||
            typeOfUsers === 'pendingVolunteers'){
            if(isUserChampionInDojo(dojo, user._id)){
                isUserAuthorized = true;
            }
        }
        if(isUserAuthorized){
            User.helper.getUsersForMember(dojo[typeOfUsers], function(err, users){
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

                        } else {
                            logger.error(`Dojo (id=${dojoId}) not found by: ${helper.getUser(req)}, while accepting pending member`);
                            return res.sendStatus(500);
                        }
                    })
            } else {
                res.json({success: true});
            }
        } else {
            logger.error(`${helper.getUser(req)} tried to accept pending member (userId=${userToRejectId}) of dojo (${dojoId})
                            while not authorized`);
            res.json({errors: keys.notAuthorizedError});
        }
    });
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
                //Adding fields the user does has access to
                dojoRet.champions = dojo.champions;
                dojoRet.mentors = dojo.mentors;
                dojoRet.volunteers = dojo.volunteers;
                dojoRet.parents = dojo.parents;
                dojoRet.attendees = dojo.attendees;

                dojoRet[keys.hasJoined] = true;
                dojoRet[keys.showMembers] = true;
                dojoRet[keys.mentor] = true;

            }
            else if(isUserVolunteerInDojo(dojo, user._id)){
                logger.silly(`User is a Volunteer or attendee or parent in this dojo`);
                //We have determined that the user is a volunteer an attendee or a parent in this dojo
                dojoRet.champions = dojo.champions;
                dojoRet.mentors = dojo.mentors;
                dojoRet.volunteers = dojo.volunteers;

                dojoRet[keys.hasJoined] = true;
                dojoRet[keys.showMembers] = true;
                dojoRet[keys.volunteer] = true;
            }
            else if(isUserAttendeeInDojo(dojo, user._id)){
                logger.silly(`User is a Volunteer or attendee or parent in this dojo`);
                //We have determined that the user is a volunteer an attendee or a parent in this dojo
                dojoRet.champions = dojo.champions;
                dojoRet.mentors = dojo.mentors;
                dojoRet.volunteers = dojo.volunteers;

                dojoRet[keys.hasJoined] = true;
                dojoRet[keys.showMembers] = true;
                dojoRet[keys.attendee] = true;
            }
            else if(isUserParentInDojo(dojo, user._id) ){
                logger.silly(`User is a Volunteer or attendee or parent in this dojo`);
                //We have determined that the user is a volunteer an attendee or a parent in this dojo
                dojoRet.champions = dojo.champions;
                dojoRet.mentors = dojo.mentors;
                dojoRet.volunteers = dojo.volunteers;

                dojoRet[keys.hasJoined] = true;
                dojoRet[keys.showMembers] = true;
                dojoRet[keys.parent] = true;
            }
            else if (isUserChampionInDojo(dojo, user._id)){
                logger.silly(`User is champion`);
                //We have determined that the user is a champion in this dojo
                //TODO remove if deemed unecessary (noticed this info was not used, but not sure now)
                //dojoRet.champions = dojo.champions;
                //dojoRet.pendingChampions = dojo.pendingChampions;
                //dojoRet.mentors = dojo.mentors;
                //dojoRet.pendingMentors = dojo.pendingMentors;
                //dojoRet.volunteers = dojo.volunteers;
                //dojoRet.pendingVolunteers = dojo.pendingVolunteers;
                //dojoRet.parents = dojo.parents;
                //dojoRet.attendees = dojo.attendees;
                dojoRet.recurrentEvents = dojo.recurrentEvents;

                dojoRet[keys.canEditDojo] = true;
                dojoRet[keys.canAcceptMembers] = true;
                dojoRet[keys.canAddEvent] = true;
                dojoRet[keys.hasJoined] = true;
                dojoRet[keys.showMembers] = true;
                dojoRet[keys.champion] = true;
            } else if(isUserAdmin(user)){
                logger.silly(`User is admin`);
                //We determine that the user is an admin in this dojo
                //dojoRet.champions = dojo.champions;
                //dojoRet.pendingChampions = dojo.pendingChampions;
                //dojoRet.mentors = dojo.mentors;
                //dojoRet.pendingMentors = dojo.pendingMentors;
                //dojoRet.volunteers = dojo.volunteers;
                //dojoRet.pendingVolunteers = dojo.pendingVolunteers;
                //dojoRet.parents = dojo.parents;
                //dojoRet.attendees = dojo.attendees;
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
    return user.authorizationLevel === keys.admin;
}

function isUserVolunteerInDojo(dojo, userId){
    if(dojo.volunteers){
        return (dojo.volunteers.indexOf(userId.toString()) > -1);
    } else {
        logger.debug(`dojo.volunteers is not defined, dojo ${JSON.stringify(dojo)}`);
    }
}

function isUserPendingVolunteerInDojo(dojo, userId){
    if(dojo.pendingVolunteers){
        return (dojo.pendingVolunteers.indexOf(userId.toString()) > -1);
    } else {
        logger.debug(`dojo.pendingVolunteers is not defined, dojo ${JSON.stringify(dojo)}`);
    }
}

function isUserAttendeeInDojo(dojo, userId){
    if(dojo.attendees){
        return (dojo.attendees.indexOf(userId.toString()) > -1);
    } else {
        logger.debug(`dojo.attendees is not defined, dojo ${JSON.stringify(dojo)}`);
    }
}

function isUserParentInDojo(dojo, userId){
    if(dojo.parents){
        return (dojo.parents.indexOf(userId.toString()) > -1);
    } else {
        logger.debug(`dojo.parents is not defined, dojo ${JSON.stringify(dojo)}`);
    }
}

function isUserMentorInDojo(dojo, userId){
    if(dojo.mentors){
        return (dojo.mentors.indexOf(userId.toString()) > -1);
    } else {
        logger.debug(`dojo.mentors is not defined, dojo ${JSON.stringify(dojo)}`);
    }
}

function isUserPendingMentorInDojo(dojo, userId){
    if(dojo.pendingMentors){
        return (dojo.pendingMentors.indexOf(userId.toString()) > -1);
    } else {
        logger.debug(`dojo.pendingMentors is not defined, dojo ${JSON.stringify(dojo)}`);
    }
}

function isUserChampionInDojo(dojo, userId){
    if(dojo.champions){
        return (dojo.champions.indexOf(userId.toString()) > -1);
    } else {
        logger.debug(`dojo.champion is not defined, dojo ${JSON.stringify(dojo)}`);
    }
}

function isUserPendingChampionInDojo(dojo, userId){
    if(dojo.pendingChampions){
        return (dojo.pendingChampions.indexOf(userId.toString()) > -1);
    } else {
        logger.debug(`dojo.pendingChampions is not defined, dojo ${JSON.stringify(dojo)}`);
    }
}

function isUserMemberOfDojo(dojo, userId){
    return isUserAttendeeInDojo(dojo, userId) || isUserMentorInDojo(dojo, userId) ||
        isUserChampionInDojo(dojo, userId) || isUserParentInDojo(dojo, userId) || isUserVolunteerInDojo(dojo, userId);
}

function isUserPendingMemberOfDojo(dojo, userId){
    return isUserPendingChampionInDojo(dojo, userId) || isUserPendingMentorInDojo(dojo, userId) ||
        isUserPendingVolunteerInDojo(dojo, userId);
}

function isUserMemberOrPendingMemberOfDojo(dojo, userId){
    return isUserMemberOfDojo(dojo, userId) || isUserPendingMemberOfDojo(dojo, userId);
}

//Method for sanitizing the fields of a dojo
function sanitizeDojo(dojo){
    //Cloning the dojo
    let ret = JSON.parse(JSON.stringify(dojo));
    const whiteListNames = 'aăâbcdefghiîjklmnopqrsștțuvwxyzAĂÂBCDEFGHIÎJKLMNOPQRSȘTȚUVWXYZ1234567890.,@!?+- ';


    //Sanitizing the name
    let sanitName = validator.trim(dojo.name);
    sanitName = validator.whitelist(sanitName, whiteListNames);
    ret.name = sanitName;

    //Sanitizing the adress
    let sanitAdress = validator.trim(dojo.address);
    sanitAdress = validator.whitelist(sanitAdress, whiteListNames);
    ret.address = sanitAdress;

    //Sanitizing the email
    let sanitEmail = validator.trim(dojo.email);
    sanitEmail = validator.whitelist(sanitEmail, whiteListNames);
    ret.email = sanitEmail;

    //Sanitizing the statuses
    let sanitStatuses = ret.statuses.map(function(status){
        return validator.whitelist(status, whiteListNames);
    });
    ret.statuses = sanitStatuses;

    //Sanitizing the requirements
    let sanitRequirements = ret.requirements.map(function(requirement){
        return validator.whitelist(requirement, whiteListNames);
    });
    ret.requirements = sanitRequirements;

    //Sanitizing the recurrent events
    for(let i = 0; i < ret.recurrentEvents.length; i++){
        let event = ret.recurrentEvents[i];
        //Sanitizing the event name
        let eventName = event.name;
        let sanitEventName = validator.trim(eventName);
        sanitEventName = validator.whitelist(sanitEventName, whiteListNames);
        event.name = sanitEventName;

        //Sanitizing the event description
        let eventDescr = event.description;
        let sanitEventDescr = validator.trim(eventDescr);
        event.description = sanitEventDescr;

        for(let j = 0; j < event.sessions.length; j++){
            let session = event.sessions[j];

            //Sanitizing session workshop
            let sessionWorkshop = session.workshop;
            let sanitWorkshop = validator.trim(sessionWorkshop);
            sanitWorkshop = validator.whitelist(sanitWorkshop, whiteListNames);
            session.workshop = sanitWorkshop;

            //Sanitizing the tickets
            for(let k = 0; k < session.tickets.length; k++){
                let ticket = session.tickets[k];

                //Sanitizing ticket name
                let ticketName = ticket.nameOfTicket;
                let sanitTicketName = validator.trim(ticketName);
                sanitTicketName = validator.whitelist(sanitTicketName, whiteListNames);
                ticket.nameOfTicket = sanitTicketName;
            }
        }
    }

    return ret;
}



