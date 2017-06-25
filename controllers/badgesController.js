/**
 * Created by catap_000 on 6/19/2017.
 */

const keys = require('../static_keys/project_keys');
const User = require('../models/userModel');
const Badge = require('../models/badgeModel');
const logger = require('winston');
const validator = require('validator');
const helper  = require('./helperController');
const multer = require('multer');
const mime = require('mime');
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
    Badge.getAllBadges(function(err, badges){
        if(err){
            logger.error(`Error getting all badges for ${helper.getUser(req)}: ` + err);
            return res.sendStatus(500);
        }
        res.json({badges: badges});
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

