/**
 * Created by catap_000 on 6/19/2017.
 */

const keys = require('../static_keys/project_keys');
const User = require('../models/userModel');
const Badge = require('../models/badgeModel');
const Dojo = require('../models/dojoModel');
const logger = require('winston');
const validator = require('validator');
const helper  = require('./helperController');
const multer = require('multer');
const mime = require('mime');
const mongoose = require('mongoose');
const async = require('async');
let upload;

module.exports.addBadge = function(req, res){
    logger.debug(`Entering BadgesRoute: ${keys.addBadgeRoute} by ${helper.getUser(req)}`);
    let user = req.user;
    let badge = req.body.badge;

    let sanitizedBadge = sanitizeBadge(badge);
    if(areBadgesEqual(sanitizedBadge, badge)){
        if(helper.isUserAdmin(user)){
            Badge.addBadge(badge, function(err){
                if(err){
                    logger.error(`Error saving badge for ${helper.getUser(req)}: ` + err);
                    return res.sendStatus(500);
                }
                res.json({success: true});

            });
        } else {
            logger.error(`User ${helper.getUser(req)} tried to add a badge while not authorized to do so)`);
            res.json({errors: keys.notAuthorizedError});
        }
    } else {
        //If the sanitization has modified the badge, we inform the user
        res.json({errors: keys.notSanitizedError, sanitizedBadge: sanitizedBadge});
    }
};

module.exports.editBadge = function(req, res){
    logger.debug(`Entering BadgesRoute: ${keys.editBadgeRoute} by ${helper.getUser(req)}`);
    let user = req.user;
    let badge = req.body.badge;

    let sanitizedBadge = sanitizeBadge(badge);
    if(areBadgesEqual(sanitizedBadge, badge)){
        if(helper.isUserAdmin(user)){
            Badge.editBadge(badge, function(err){
                if(err){
                    logger.error(`Error editing badge ${JSON.stringify(badge)} for ${helper.getUser(req)}: ` + err);
                    return res.sendStatus(500);
                }
                res.json({success: true});

            });
        } else {
            logger.error(`User ${helper.getUser(req)} tried to add a badge while not authorized to do so)`);
            res.json({errors: keys.notAuthorizedError});
        }
    } else {
        //If the sanitization has modified the badge, we inform the user
        res.json({errors: keys.notSanitizedError, sanitizedBadge: sanitizedBadge});
    }
};

function sanitizeBadge(badge){
    let ret = JSON.parse(JSON.stringify(badge));
    ret.name = validator.whitelist(ret.name, helper.eventWhiteListNames);
    ret.description = validator.whitelist(ret.description, helper.eventWhiteListNames);
    return ret;
}

function areBadgesEqual(badge1, badge2){
    if(badge1.name != badge2.name ||
        badge1.points != badge2.points ||
        badge1.description != badge2.description){
        return false;
    } else {
        return true;
    }
}

//Route getting all badges for UNauthenticated badges
module.exports.getAllBadges = function(req, res){
    logger.debug(`Entering BadgesRoute: ${keys.getAllBadgesRoute}`);
    Badge.getAllBadges(function(err, badges){
        if(err){
            logger.error(`Error getting all badges for an unauthenticated user: ` + err);
            return res.sendStatus(500);
        }
        res.json({badges: badges});
    });
};

//Route getting all badges for Authenticated badges
module.exports.getAuthAllBadges = function(req, res){
    logger.debug(`Entering BadgesRoute: ${keys.getAuthAllBadgesRoute} by ${helper.getUser(req)}`);
    let user = req.user;
    async.parallel({
        allBadges: function(callback){
            Badge.getAllBadges(callback);
        },
        userBadges: function(callback){
            User.getBadgesOfUser(user._id, callback);
        }
    }, function(err, results){
        if(err){
            logger.error(`Error getting all auth badges for ${helper.getUser(req)}: ` + err);
            return res.sendStatus(500);
        }
        res.json({allBadges: results.allBadges, userBadges: results.userBadges.badges});
    });
};

module.exports.uploadBadgePicture = function(req, res){
    logger.debug(`Entering BadgesRoute: ${keys.uploadBadgePictureRoute} by ${helper.getUser(req)}`);
    let user = req.user;
    if(helper.isUserAdmin(user)){
       upload(req, res, function(err){
           let badgeId = req.body.badgeId;
           if(err){
               logger.error(`Error uploading badge photo for badge (_id=${badgeId}) by ${helper.getUser(req)}:` + err);
               return res.sendStatus(500);
           }
           let filename = req.file.filename;
           Badge.updateBadgePhoto(badgeId, filename, function(err){
               if(err){
                   logger.error(`Error updating badge photo for badge (_id=${badgeId}) by ${helper.getUser(req)}:` + err);
                   return res.sendStatus(500);
               }
               res.json({badgePhoto:filename});
               //TODO delete the old photo of the badge
           });


       })
    } else {
        logger.error(` ${helper.getUser(req)} tried to add a badge photo while now authorized to do so`);
        res.json({errors:keys.notAuthorizedError});
    }
};

let storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, __dirname + '/../client/img/badges');
    },
    filename: function (req, file, callback) {
        callback(null, `${req.body.badgeId}_${Date.now()}.${mime.extension(file.mimetype)}`);
    }
});

//TODO must check for photo type
upload =  multer({storage:storage}).single('badge-photo');

module.exports.addBadgesToUsers = function(req, res){
    logger.debug(`Entering BadgesRoute: ${keys.addBadgesToUsersRoute} by ${helper.getUser(req)}`);
    let user = req.user;
    let dojoId = req.body.dojoId;
    let usersToAddBadgesTo = req.body.users;
    let badges = req.body.badges;
    let startTime = Date.now();

    Dojo.getDojoForInternalAuthentication(dojoId, function(err, dojo){
        if (err){
            logger.error(`Error getting dojo for for ${helper.getUser(req)}, for ${keys.addBadgesToUsersRoute}:` + err);
            return res.sendStatus(500);
        }
        // We determine if the user is authorized for the action
        if(helper.isUserAdmin(user) || helper.isUserBadgeGiverOfDojo(dojo, user._id)){
            res.json({success: true});
            for(let i = 0; i < usersToAddBadgesTo.length; i++){
                let userToAdBadgeTo = usersToAddBadgesTo[i];
                //This is used to calculate the time necessary for adding badges
                let tempStartTime = null;
                if(i == (usersToAddBadgesTo.length - 1)){
                    tempStartTime = startTime;
                }
                addBadgesToUser(userToAdBadgeTo, badges, tempStartTime);
            }
        } else {
            logger.error(`${helper.getUser(req)} tried to add badges to users of dojo (_id=${dojoId})
                            while not authorized`);
            res.json({errors: keys.notAuthorizedError});
        }
    });
};

function addBadgesToUser(user, newBadges, startTime){
    User.getBadgesOfUser(user._id, function(err, userWithBadges){
        if(err){
            logger.error(`Error getting user's ${JSON.stringify(user)}, badges adding new badges to the user:` + err);
            return;
        }
        let mergedBadges = mergeOldBadgesWithNewBadges(userWithBadges.badges, newBadges);
        //Now we save the badges
        User.setBadgesOfUser(user._id, mergedBadges, function(err){
            if(err){
                logger.error(`Error saving user's ${JSON.stringify(user)}, new badges (${JSON.stringify(mergedBadges)}):` + err);
                return;
            }
            //Then we notify the user he/she received badges
            let notifications = createNotificationsForNewBadges(newBadges);
            User.addNotificationsForUser(user._id, notifications, function(err){
                if(err){
                    logger.error(`Error adding notifications for user ${JSON.stringify(user)}, after he/she received new ` +
                        ` badges (${JSON.stringify(mergedBadges)})=======ERROR=` + err);
                    return;
                }
                if(startTime){
                    logger.debug(`Badges and notifications added in ${Date.now() - startTime} ms.`);
                }
            });

        })

    })
};

function createNotificationsForNewBadges(newBadges){
    let ret = [];
    for(let i = 0; i < newBadges.length; i++){
        let newBadge = newBadges[i];
        let msg = 'Ai primite badge-ul ' + newBadge.name + ' în valoare de ' + newBadge.points +
            (newBadge.points == 1 ? ' punct' : 'puncte') + '! FELICITARI!'
        ret.push(helper.makeInfoNotification(msg));
    }

    return ret;
}

//Method that adds the new badges to the old badges of a user.
function mergeOldBadgesWithNewBadges(oldBadges, newBadges){
    let now = new Date();
    //We clone this object because objects received from the database are frozen
    oldBadges = JSON.parse(JSON.stringify(oldBadges));
    logger.silly(`Old badges ${JSON.stringify(oldBadges)}`);
    for(let i = 0; i < newBadges.length; i++){
        let newBadge = newBadges[i];
        let newBadgeAdded = addNewBadgeToOldBadgesListIfItAlreadyExists(newBadge, oldBadges, now);
        if(!newBadgeAdded){
            //If the the new badge does not exist in the old badges list
            oldBadges.push({
                typeOfBadge: new mongoose.mongo.ObjectId(newBadge._id),
                received: [now]
            })

        }
    }
    return oldBadges;
}

//This method checks if the new badge exists in the list of old badges, and if it does, it adds another timestamp to mark
// that anoher instance of the badge has been received.
function addNewBadgeToOldBadgesListIfItAlreadyExists(newBadge, oldBadges, now){
    let ret = false;
    for(let i = 0; i < oldBadges.length; i++){
        if(oldBadges[i].typeOfBadge._id == newBadge._id){
            //We add another instance of the date
            oldBadges[i].received.push(now);
            ret = true;
            break;
        }
    }
    return ret;
}





