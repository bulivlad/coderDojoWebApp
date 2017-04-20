/**
 * Created by Adina Paraschiv on 4/8/2017.
 */

const keys = require('../static_keys/project_keys');
const Dojo = require('../models/dojoModel');
const User = require('../models/userModel');
const logger = require('winston');

//This is used to cache the dojos, so if there are no modifications, we do not use the database
let dojoKeeper = {

};


//Method for adding a new dojo (only the admin can do that)
module.exports.addDojo = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.addDojoRoute} by ${getUser(req)}`);
    if(req.user.authorizationLevel === keys.admin){
        let dojo = req.body.dojo;
        dojo.requirements = dojo.requirements.split('\n');
        logger.silly(`Dojo to save: ${JSON.stringify(dojo)}`);
        let newDojo = new Dojo(dojo);
        newDojo.save(function(err, savedDojo){
            if(err){
                logger.error(`Error adding a dojo by ${getUser(req)}:` + err);
                return res.sendStatus(500);
            }
            res.json({success: true});
        });
    } else {
        logger.error(`${getUser(req)} tried to add a dojo while not authorized to do so`);
        res.json({errors: keys.notAuthorizedError});
    }
};

//Method that returns the upcoming dojos for unauthorized users
module.exports.getDojos = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.getDojos}`);
    getUnauthenticatedDojos(function(err, dojos){
        if (err){
            logger.error('Problems retrieving dojos from database: ' + err);
            return res.sendStatus(500);
        }
        res.json({dojos:dojos});
    });
};

//Method for getting dojos of authenticated users
module.exports.getAuthenticatedDojos = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.getAuthDojos}`);
    getAuthenticatedDojos(function(err, dojos){
        if (err){
            logger.error('Problems retrieving dojos from database: ' + err);
            return res.sendStatus(500);
        }
        dojos = prepareDojosBasedOnUserPermisions(req.user, dojos);
        res.json({dojos:dojos});
    });
};

//Method for getting users' dojos
module.exports.getMyDojos = function(req, res){

};

//Method for becoming member of dojo
module.exports.becomeMemberOfDojo = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.becomeMemberOfDojoRoute} for ${getUser(req)}`);
    //First we get the dojos and check if the user is not a member or a pending member of this dojo (fail safe)
    getAuthenticatedDojos(function(err, dojos){
            //logger.silly(`Dojos found: ${JSON.stringify(dojos)}`);
            let dojoToJoin = getDojoFromDojos(req.body.dojoId, dojos);
            if( isUserMemberOrPendingMemberOfDojo(dojoToJoin, req.user._id) ){
                    res.json({errors: keys.userAlreadyJoinedDojoError});
                    logger.error(`${getUser(req)} already has joined dojo ${JSON.stringify(dojoToJoin)}`);

            } else {
                //if user is not already joined or pending a dojo
                becomeMemberOfDojo(req, res);
            }
    })


};

//Helper method for adding a user to a dojo
function becomeMemberOfDojo(req, res){
    let dojoId = req.body.dojoId;
    let whatMember = req.body.whatMember;
    let listToUpdate = {};
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
        logger.error(`Request unknown by ${getUser(req)}`);
        return res.sendStatus(500);
    }
    logger.silly(`dojoId=${dojoId},whatMember:${whatMember}, listToUpdate:${JSON.stringify(listToUpdate)}`);
    console.log('userId:', req.user._id);

    Dojo.findOneAndUpdate(
        {_id: dojoId},
        listToUpdate,
        {new: true},
        function(err, dojo){
            resetCache();
            if(err){
                logger.error(`Error joining dojo by ${getUser(req)}:` + err);
                return res.sendStatus(500);
            }
            if(dojo){
                res.json({success: true});
            } else {
                logger.error(`Dojo not found by: ${getUser(req)}`);
                return res.sendStatus(500);
            }
        })
}

//Method by which a use leaves a dojo
module.exports.leaveDojo = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.leaveDojoRoute} for ${getUser(req)}`);
    let dojoId = req.body.dojoId;
    logger.silly(`Dojo id = ${dojoId}`);
    Dojo.findOneAndUpdate(
        {_id: dojoId},
        {$pull:{mentors:req.user._id, pendingMentors:req.user._id, volunteers:req.user._id,
            pendingVolunteers:req.user._id, champion:req.user._id, pendingChampions:req.user._id,
            parents:req.user._id, attendees:req.user._id}},
        function(err, dojo){
            resetCache();
            if(err){
                logger.error(`Error leaving dojo by ${getUser(req)}:` + err);
                return res.sendStatus(500);
            }
            if(dojo){
                res.json({success: true});
            } else {
                logger.error(`Dojo not found by: ${getUser(req)}`);
                return res.sendStatus(500);
            }
        })

};

//Method that gets summary info about members for a dojo
module.exports.getUsersForMember = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.getUsersForMember} for ${getUser(req)}`);
    let user = req.user;
    let dojoId = req.body.dojoId;
    let typeOfUsers = req.body.typeOfUsers;
    getAuthenticatedDojos(function(err, dojos){
        if (err){
            logger.error(`Error getting dojos for getting members for ${getUser(req)}, for dojo(${dojoId}):` + err);
            return res.sendStatus(500);
        }
        //We get the dojo in question
        let dojo = getDojoFromDojos(dojoId, dojos);
        //We check that the user has credentials to make the request
        let isUserAuthorized = isUserAdmin(user);

        if(typeOfUsers === 'parents' || typeOfUsers === 'attendees' || typeOfUsers === 'volunteers' ||
           typeOfUsers === 'mentors' || typeOfUsers === 'champion'){
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
            User.getUsersForMember(dojo[typeOfUsers], function(err, users){
                if (err){
                    logger.error(`Error getting members for ${getUser(req)}, for dojo(${dojoId}):` + err);
                    return res.sendStatus(500);
                }
                res.json({users: users});
            })
        } else {
            logger.error(`${getUser(req)} tried to get members of dojo (${dojoId}) while not authorized`);
            res.json({errors: keys.notAuthorizedError});
        }
    })
};

//Method that gets full info about a user in a dojo
module.exports.getDetailedUserForMember = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.getDetailedUserForMemberRoute} for ${getUser(req)}`);
    let userToSearchForId = req.body.userId;
    let dojoToSearchInId = req.body.dojoId;
    let user = req.user;
    getAuthenticatedDojos(function(err, dojos){
        if (err){
            logger.error(`Error getting dojos for for ${getUser(req)}, for getting member info:` + err);
            return res.sendStatus(500);
        }
        //First we retrieve the dojo where the operation takes place and determine if the user making the inquiry is
        // authorized to do so
        let dojoToSearchIn = getDojoFromDojos(dojoToSearchInId, dojos);
        if(isUserAdmin(user) || isUserChampionInDojo(dojoToSearchIn, user._id)){
            //After we determined that the user making the inquiry is authorized, we determine if the user searched for
            //is still part of the dojo (pending or already a member).
            if (isUserMemberOrPendingMemberOfDojo(dojoToSearchIn, userToSearchForId)){
                User.getDetailedUserForMember(userToSearchForId, function(err, user){
                    if (err){
                        logger.error(`Error finding user (userId=${userToSearchForId}) for ${getUser(req)},
                                        for getting member info:` + err);
                        return res.sendStatus(500);
                    }
                    console.log('getDetailedUserForMember answered');
                    res.json({user:user});
                })
            } else {
                logger.error(`User id=${userToSearchForId} is no longer part of the dojo`);
                res.json({errors: keys.notAuthorizedError});
            }
        } else {
            logger.error(`${getUser(req)} tried to get info on member (userId=${userToSearchForId}) of dojo (${dojoToSearchInId})
                            while not authorized`);
            res.json({errors: keys.notAuthorizedError});
        }

    });
};

//Method for rejecting a users application to become a member for a dojo
module.exports.rejectPendingMember = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.rejectPendingMemberRoute} for ${getUser(req)}`);
    let userToRejectId = req.body.userId;
    let dojoToSearchInId = req.body.dojoId;
    let user = req.user;
    getAuthenticatedDojos(function(err, dojos){
        if (err){
            logger.error(`Error getting dojos for for ${getUser(req)}, for rejecting member id=${userToRejectId}:` + err);
            return res.sendStatus(500);
        }
        //First we retrieve the dojo where the operation takes place and determine if the user making the inquiry is
        // authorized to do so
        let dojoToSearchIn = getDojoFromDojos(dojoToSearchInId, dojos);
        if(isUserAdmin(user) || isUserChampionInDojo(dojoToSearchIn, user._id)){
            //Now we check if the user is pending for mentor, volunteer or champion
            let typeOfUser = null;
            let dojoModifications = null;
            if(isUserPendingChampionInDojo(dojoToSearchIn, userToRejectId)){
                typeOfUser = 'campion';
                dojoModifications = {$pull: {pendingChampions: userToRejectId}};
            } else if (isUserPendingMentorInDojo(dojoToSearchIn, userToRejectId)){
                typeOfUser = 'mentor';
                dojoModifications = {$pull: {pendingMentors: userToRejectId}};
            } else if (isUserPendingVolunteerInDojo(dojoToSearchIn, userToRejectId)){
                typeOfUser = 'voluntar';
                dojoModifications = {$pull: {pendingVolunteers: userToRejectId}};
            }
            //We update the dojo by removing the user from members
            if(typeOfUser){
                Dojo.findOneAndUpdate(
                    {_id: dojoToSearchInId},
                    dojoModifications,
                    function(err, dojo){
                        resetCache();
                        if(err){
                            logger.error(`Error updating dojo while rejecting pending member in dojo by ${getUser(req)}:` + err);
                            return res.sendStatus(500);
                        }
                        if(dojo){
                            //After removing the user from pending members, we send him/her a notification of this
                            let notification = {};
                            notification.typeOfNot = keys.infoNotification;
                            notification.data = {
                                msg: `Aplicația ta ca ${typeOfUser} al dojoului ${dojoToSearchIn.name}, a fost respinsă.`
                            };
                            User.addNotificationForUser(userToRejectId, notification, function(err){
                                if(err){
                                    logger.error(`Error adding notification for user id=${userToRejectId}`);
                                }
                            });
                            res.json({success: true});

                        } else {
                            logger.error(`Dojo (id=${dojoToSearchInId}) not found by: ${getUser(req)}, while rejecting pending member`);
                            return res.sendStatus(500);
                        }
                    })
            } else {
                res.json({success: true});
            }
        } else {
            logger.error(`${getUser(req)} tried to reject pending member (userId=${userToRejectId}) of dojo (${dojoToSearchInId})
                            while not authorized`);
            res.json({errors: keys.notAuthorizedError});
        }
    });
};

//Method for accepting a users application to become a member for a dojo
module.exports.acceptPendingMember = function(req, res){
    logger.debug(`Entering DojosRoute: ${keys.acceptPendingMemberRoute} for ${getUser(req)}`);
    let userToAcceptId = req.body.userId;
    let dojoToSearchInId = req.body.dojoId;
    let user = req.user;
    getAuthenticatedDojos(function(err, dojos){
        if (err){
            logger.error(`Error getting dojos for for ${getUser(req)}, for accepting member id=${userToAcceptId}:` + err);
            return res.sendStatus(500);
        }
        //First we retrieve the dojo where the operation takes place and determine if the user making the inquiry is
        // authorized to do so
        let dojoToSearchIn = getDojoFromDojos(dojoToSearchInId, dojos);
        if(isUserAdmin(user) || isUserChampionInDojo(dojoToSearchIn, user._id)){
            //Now we check if the user is pending for mentor, volunteer or champion
            let typeOfUser = null;
            let dojoModifications = null;
            if(isUserPendingChampionInDojo(dojoToSearchIn, userToAcceptId)){
                typeOfUser = 'campion';
                dojoModifications = {$pull: {pendingChampions: userToAcceptId}, $addToSet: {champion: userToAcceptId}};
            } else if (isUserPendingMentorInDojo(dojoToSearchIn, userToAcceptId)){
                typeOfUser = 'mentor';
                dojoModifications = {$pull: {pendingMentors: userToAcceptId},  $addToSet: {mentors: userToAcceptId}};
            } else if (isUserPendingVolunteerInDojo(dojoToSearchIn, userToAcceptId)){
                typeOfUser = 'voluntar';
                dojoModifications = {$pull: {pendingVolunteers: userToAcceptId}, $addToSet: {volunteers: userToAcceptId}};
            }
            //We update the dojo by removing the user from pending members and adding him/her to the members
            if(typeOfUser){
                Dojo.findOneAndUpdate(
                    {_id: dojoToSearchInId},
                    dojoModifications,
                    function(err, dojo){
                        resetCache();
                        if(err){
                            logger.error(`Error updating dojo while accepting pending member in dojo by ${getUser(req)}:` + err);
                            return res.sendStatus(500);
                        }
                        if(dojo){
                            //After removing the user from pending members, we send him/her a notification of this
                            let notification = {};
                            notification.typeOfNot = keys.infoNotification;
                            notification.data = {
                                msg: `Aplicația ta ca ${typeOfUser} al dojoului ${dojoToSearchIn.name}, a fost acceptată.`
                            };
                            User.addNotificationForUser(userToAcceptId, notification, function(err){
                                if(err){
                                    logger.error(`Error adding notification for user id=${userToAcceptId}`);
                                }
                            });
                            res.json({success: true});

                        } else {
                            logger.error(`Dojo (id=${dojoToSearchInId}) not found by: ${getUser(req)}, while accepting pending member`);
                            return res.sendStatus(500);
                        }
                    })
            } else {
                res.json({success: true});
            }
        } else {
            logger.error(`${getUser(req)} tried to accept pending member (userId=${userToRejectId}) of dojo (${dojoToSearchInId})
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

//Method that filters the fields for dojos based on user permisions
//Flags in method"
// showMembers: this is for the show members button in the dojos view (only members have access to other members)
function prepareDojosBasedOnUserPermisions(user, dojos, forMyDojos){
    //cloning the dojos
    let dojosRet = [];
    if(dojos){
        dojos.forEach(function(dojo){
            //cloning the dojo
            dojo = JSON.parse(JSON.stringify(dojo));
            logger.silly(`=======================================`);
            logger.silly(`DojoName: ${dojo.name}, DojoId=${dojo._id}`);

            let userBelongsToThisDojo = true;

            //logger.silly(`Dojo=${JSON.stringify(dojo)}`);
            if(isUserMentorInDojo(dojo, user._id)){
                logger.silly(`User is a mentor in this dojo`);
                dojo[keys.hasJoined] = true;
                //Removing fields the user does not have access to
                dojo.pendingMentors = undefined;
                dojo.pendingVolunteers = undefined;
                dojo.pendingVolunteers = undefined;
                dojo[keys.showMembers] = true;

            }
            else if(isUserVolunteerInDojo(dojo, user._id) ||
                    isUserAttendeeInDojo(dojo, user._id)        ||
                    isUserParentInDojo(dojo, user._id) ){
                logger.silly(`User is a Volunteer or attendee in this dojo`);
                dojo[keys.hasJoined] = true;

                //Removing fields the user does not have access to
                dojo.pendingMentors = undefined;
                dojo.mentors = undefined;
                dojo.pendingVolunteers = undefined;
                dojo.volunteers = undefined;
                dojo.pendingChampions = undefined;
                dojo.champion = undefined;
                dojo.pendingAttendees = undefined;
                dojo.attendees = undefined;
                dojo[keys.showMembers] = true;
            }
            else if (isUserChampionInDojo(dojo, user._id)){
                logger.silly(`User is champion`);
                dojo[keys.canEditDojo] = true;
                dojo[keys.canAcceptMembers] = true;
                dojo[keys.canAddEvent] = true;
                dojo[keys.hasJoined] = true;
                dojo[keys.showMembers] = true;
            } else if(isUserAdmin(user)){
                logger.silly(`User is admin`);
                dojo[keys.canEditDojo] = true;
                dojo[keys.canAcceptMembers] = true;
                dojo[keys.canAddEvent] = true;
                dojo[keys.hasJoined] = true;
                dojo[keys.admin] = true;
                dojo[keys.showMembers] = true;
            } else {
                //Removing fields the user does not have access to
                logger.silly(`User isn't in the dojo yet`);
                dojo.mentors = undefined;
                dojo.volunteers = undefined;
                dojo.champion = undefined;
                dojo.attendees = undefined;
                userBelongsToThisDojo = false;
                logger.silly(`pendingChampions: ${dojo.pendingChampions}`);
                logger.silly(`pendingVolunteers: ${dojo.pendingVolunteers}`);
                logger.silly(`pendingMentors: ${dojo.pendingMentors}`);
                if(isUserPendingMemberOfDojo(dojo, user._id)){
                    logger.silly('user is pending');
                    dojo[keys.isPendingJoining] = true;
                }
                dojo.pendingVolunteers = undefined;
                dojo.pendingChampions = undefined;
                dojo.pendingMentors = undefined;
            }

            if(forMyDojos){//If the method is used to add only my dojos
                if(userBelongsToThisDojo){//only add it if the user belongs to this dojo
                    dojosRet.push(dojo);
                }
            } else {
                dojosRet.push(dojo);
            }
            logger.silly(`=======================================`);

        })
    }
    return dojosRet;
}

//Method for resetting cache for dojos. When the dojos are retrieved frm the data base, they are cached in the application.
//The cache is purged only when modifications are made to the dojos.
function resetCache(){
    dojoKeeper = {};
}

function isUserAdmin(user){
    return user.authorizationLevel === keys.admin;
}

function isUserVolunteerInDojo(dojo, userId){
    return (dojo.volunteers.indexOf(userId.toString()) > -1);
}

function isUserPendingVolunteerInDojo(dojo, userId){
    return (dojo.pendingVolunteers.indexOf(userId.toString()) > -1);
}

function isUserAttendeeInDojo(dojo, userId){
    return (dojo.attendees.indexOf(userId.toString()) > -1);
}

function isUserParentInDojo(dojo, userId){
    return (dojo.parents.indexOf(userId.toString()) > -1);
}

function isUserMentorInDojo(dojo, userId){
    return (dojo.mentors.indexOf(userId.toString()) > -1);
}

function isUserPendingMentorInDojo(dojo, userId){
    return (dojo.pendingMentors.indexOf(userId.toString()) > -1);
}

function isUserChampionInDojo(dojo, userId){
    return (dojo.champion.indexOf(userId.toString()) > -1);
}

function isUserPendingChampionInDojo(dojo, userId){
    return (dojo.pendingChampions.indexOf(userId.toString()) > -1);
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

//Method for getting the unauthenticated dojos
function getUnauthenticatedDojos(callback){
    if(dojoKeeper.unauthenticatedDojos){
        logger.debug('Getting UnauthenticatedDojos from cache');
        callback(null, dojoKeeper.unauthenticatedDojos);
    } else {
        logger.debug('Getting UnauthenticatedDojos from database');
        Dojo.getDojos(function(err, dojos){
            if (err){
                return callback(err);
            }
            callback(null, dojos);
            dojoKeeper.unauthenticatedDojos = dojos;
        });
    }
}

//Method for getting the unauthenticated dojos
function getAuthenticatedDojos(callback){

    if(dojoKeeper.authenticatedDojos){
        logger.debug('Getting AuthenticatedDojos from cache');
        callback(null, dojoKeeper.authenticatedDojos);
    } else {
        logger.debug('Getting AuthenticatedDojos from database');
        Dojo.getAuthDojos(function(err, dojos){
            if (err){
                return callback(err);
            }
            callback(null, dojos);
            dojoKeeper.authenticatedDojos = dojos;
        });
    }
}

//Method for displaying user information for logging
function getUser(req){
    if(req.user){
        return `user=(email=${req.user.email}, alias=${req.user.alias}, _id=${req.user._id},
                authorizationLevel=${req.user.authorizationLevel})`;
    }
}

