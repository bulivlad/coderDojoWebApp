/**
 * Created by Adina Paraschiv on 4/8/2017.
 */

const keys = require('../static_keys/project_keys');
const User = require('../models/userModel');
const Dojo = require('../models/dojoModel');
//const bcrypt = require('bcryptjs');
const logger = require('winston');
const validator = require('../validator/validator');
const multer = require('multer');
const mime = require('mime');
const helper = require('./helperController');
let upload;

//Method for registering user
module.exports.registerUser = function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.register} for user (email=${req.body.user.email},
                   alias=${req.body.user.email})`);
    //First we validate and sanitize the user fields received from the client
    //TODO we need to sanitize the data received from the client
    let errors = validateFields(req, keys.regUserOver14Profile);
    if (errors){
        //If there are errors, we sent them back to the client
        res.json({errors: errors})
    } else {
        let user = req.body.user;
        //No validation errors at this point
        //Fist we check if the the email is already in use
        User.findOne({email: user.email}, function(err, result){
            if (err){
                return res.sendStatus(500);
            }
            if(result){
                //If we already find an entry with this email we send an error to the client that the email is already in use
                errors = [];
                errors.push(createServerError('email', 'Cont existent'));
                res.json({errors:errors});
                logger.info("An account with this email already exists: " + (req.body.user.email));
            } else {
                //If there are no errors
                //We remove password2, as this was only check for the user to make sure they typed the password correctly
                user.password2 = undefined;
                let newUser = new User(user);
                //We save the user
                User.createUser(newUser, function(err, user){
                    if(err){
                        logger.error('Error saving user in the database:' + err);
                        return res.sendStatus(500);
                    }
                    //If there was no error, the user was created
                    logger.debug('User created:', user.email);
                    res.json({success:true});
                });
            }
        });
    }
};

module.exports.registerUsersChild = function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.registerChildRoute} for ${helper.getUser(req)}`);
    let childUser = req.body.user;
    logger.silly('user:' + JSON.stringify(childUser));
    let childUserType = childUser.userType;
    //TODO sanitize the fields for malicious intent
    let errors = validateFields(req, childUserType);
    if (errors){
        res.json({errors: errors})
    } else {
        //No validation errors at this point
        //We make sure the alias is unique
        User.findOne({alias: childUser.alias}, function(err, aliasFound){//TODO make one call for email and alias checking
            if (err){
                logger.error('Error seaching database for alias (' + childUser.alias + ') : ' + err);
                return res.sendStatus(500);
            }
            else if(aliasFound){
                //If we already find an entry with this alias
                errors = [];
                errors.push(createServerError('alias', 'Alias existent'));
                res.json({errors:errors});
                logger.debug("An account with this alias already exists: " + (childUser.alias));
            } else {
                //We must make sure the email is unique as well
                if(childUser.email){
                    User.findOne({email:childUser.email}, function(err, emailFound){
                        if (err){
                            logger.error('Error seaching database for email(' + childUser.email + ') : ' + err);
                            return res.status(500).json({errors:keys.dbsUserCreationError})
                        }
                        else if(emailFound){
                            //If we already find an entry with this email
                            errors = [];
                            errors.push(createServerError('email', 'Email existent'));
                            res.json({errors:errors});
                            logger.info("An account with this email already exists: " + (childUser.email));
                        } else {
                            saveChildToDbsAndRegisterWithParent(req, res, childUser);
                        }
                    });
                } else {
                    saveChildToDbsAndRegisterWithParent(req, res, childUser);
                }
            }
        });
    }
};

//Method for login in user
module.exports.loginUser = function(req, res){
    logger.debug(`Entering UsersRoute:${keys.login}`);
    //IF the user passed login
    res.json({success:true});
};

//Method for checking if user is authenticated and getting the user object
module.exports.amIAuthenticated = function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.amIAuthenticatedUserRoute} for ${helper.getUser(req)}`);
    res.json({user:req.user});
};

//Method for getting user's children
module.exports.getUsersChildren = function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.getChildrenRoute} for ${helper.getUser(req)}`);
    if(req.user && req.user.children && req.user.children.length > 0){
        User.find({_id: {$in: req.user.children}}, {password: false, creationDate: false, notifications:false},
            function(err, expandedChildren){
                if (err){
                    logger.error('Could not get children: ' + err);
                    return res.sendStatus(500);
                }
                //TODO remove password from and other private fields from children
                res.json({children:expandedChildren});
            });
    } else {
        logger.error(`${helper.getUser(req)} has no children but issued request for children`);
        res.json({errors: keys.noChildrenError});
    }
};

//Method for getting user's parents
module.exports.getUsersParents = function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.getUsersParentsRoute} for ${helper.getUser(req)}`);
    if(req.user && req.user.parents && req.user.parents.length > 0){//TODO this always returns noParentsError (test why)
        User.find({_id: {$in: req.user.parents}}, {password: false, creationDate: false},function(err, expandedParents){
            if (err){
                logger.error('Could not get parents: ' + err);
                return res.sendStatus(500);
            }
            //TODO remove password from and other private fields from children
            res.json({parents:expandedParents});
        });
    } else {
        logger.error(`${helper.getUser(req)} has no parents but issued request for parents`);
        res.json({errors: keys.noParentsError});
    }
};

//Method for getting the parents of a user's child
module.exports.getChildsParents = function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.getChildsParentsRoute} for ${helper.getUser(req)}`);
    let parents = req.body.parents;
    //TODO add check that the current user is the parent of the child asking for parents
    logger.silly(`Parents to search for ${parents}`);
    User.find({_id: {$in: parents}},
        {password: false, creationDate: false, children:false, parents:false, badges:false, notifications: false},//TODO add proper levels of information
        function(err, childsParents){
            if (err){
                logger.error('Could not get parents: ' + err);
                return res.sendStatus(500);
            }
            //TODO remove password from and other private fields from children
            res.json({parents:childsParents});
        });
};

//Method for logging out a user
module.exports.logout = function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.logout},  user: ${req.user.email}`);
    req.logout();
    res.json({success:true});
};

//method for editing a user
module.exports.editUser = function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.editUser} for ${helper.getUser(req)}`);
    let newUser = req.body.user;
    logger.silly(`Original user: ${JSON.stringify(req.user)}`);
    logger.silly(`Modified user: ${JSON.stringify(newUser)}`);
    //We check that the user editing the account is the logged in user
    if (req.user._id != newUser._id){//One is objectId one is String, hence the weak comparator
        res.json({errors:keys.wrongUserError});
        logger.error(`Logged in user email (email=${req.user.email}, _id=${req.user._id}) does not match edited
                    user (email=${req.user.email}, _id=${req.user._id}) info`);
    } else {
        let errors = validateFields(req, keys.editUserOver14Profile);
        if (errors){
            logger.debug('Errors validating fields:' + JSON.stringify(errors));
            res.json({errors:errors});
        } else {
            logger.silly('newUser', JSON.stringify(newUser , undefined, 2));
            User.findOneAndUpdate({'_id':req.user._id}, //The user to update (the currently authenticated user)
                {$set: selectUserFieldsForSaving(newUser)}, // what to modify the current user to
                function(err){
                    if (err){
                        logger.error(`Error modifying user (${req.user.email}) in the database: ` + err);
                        return res.sendStatus(500);
                    } else {
                        res.json({success: true});
                    }
                });
        }
    }
};

//Method for editing a user's child
module.exports.editUsersChild = function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.editUsersChild} for ${helper.getUser(req)}`);
    let usersChild = req.body.user;
    logger.silly(`Original user: ${JSON.stringify(req.user)}`);
    logger.silly(`Users child: ${JSON.stringify(usersChild)}`);
    //We check that the user editing the child is its parent
    if (!isUsersChild(req.user, usersChild)){
        res.json({errors:keys.wrongUserError});
        logger.error(`Logged in user (email=${req.user.email}, _id=${req.user._id}) does not have a child:
                    (email=${usersChild.email}, alias=${usersChild.alias} _id=${usersChild._id}) `);
    } else {
        let errors = validateFields(req, usersChild.userType);
        if (errors){
            logger.debug('Errors validating fields:' + JSON.stringify(errors));
            res.json({errors:errors});
        } else {
            User.findOneAndUpdate({'_id':usersChild._id}, //The user to update (the child of the authenticated user)
                {$set: selectUserFieldsForSaving(usersChild)}, // what to modify the current user to
                {new: true}, //Return the new, modified user
                function(err){
                    if (err){
                        logger.error(`Error modifying child user (email=${usersChild.email}, alias=${usersChild.alias} _id=${usersChild._id})
                                      by the parent (email=${req.user.email}, alias=${req.user.alias} _id=${req.user._id}) in the database: ` + err);
                        return res.sendStatus(500);
                    } else {
                        res.json({success: true});
                    }
                });
        }
    }
};

//Method for getting user's notifications
module.exports.getUsersNotifications = function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.getUsersNotificationsRoute} for ${helper.getUser(req)}`);
    User.getUserNotificationsAndResetNewNotifications(req.user._id, function(err, user){
        if(err){
            logger.error(`Error searching database for notifications for ${helper.getUser(req)}:` + err);
            return res.sendStatus(500);
        }
        logger.debug(`Notifications for ${helper.getUser(req)} are: ` + JSON.stringify(user.notifications));
        let usersNotifications = user.notifications ? user.notifications.notifications: [];
        res.json({
            notificationObject:{
                ownerOfNotifications: req.user._id,
                notifications: usersNotifications
            }
        })
    })
};

//Method for getting user's child's notifications
module.exports.getUsersChildsNotifications = function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.getUsersChildNotificationsRoute} for ${helper.getUser(req)}`);
    let childId = req.body.childId;
    if(isUsersChild(req.user, {_id:childId})) {
        User.getUserNotificationsAndResetNewNotifications(childId, function (err, child) {
            if (err) {
                logger.error(`Error searching database for notifications for child (_id=${childId}) of ${helper.getUser(req)}:` + err);
                return res.sendStatus(500);
            }
            logger.debug(`Notifications for child (_id=${childId} are: ` + JSON.stringify(child.notifications));
            let childNotifications = child.notifications ? child.notifications.notifications: [];
            res.json({
                notificationObject: {
                    ownerOfNotifications: childId,
                    notifications: childNotifications
                }
            })
        })
    } else {
        logger.debug(`User (email=${getUser()}) doesn't have a child (_id=${childId})`);
        let errors = [];
        errors.push(createServerError(keys.error, 'child is not parents\''));
        res.json({errors:errors});
    }
};

//Method for inviting a user to be parent
module.exports.inviteUserToBeParent = function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.inviteUserToBeParentRoute} for ${helper.getUser(req)}`);
    let invitation = req.body.invitation;
    logger.silly(`Invitation = ${JSON.stringify(invitation)}`);

    User.findOne({email: invitation.parentEmail},{children: true, birthDate: true, notifications: true}, function(err, user){
        if(err){
            logger.error(`Error searching database for user (email=${invitation.parentEmail}), for childInvitation:` + err);
            return res.sendStatus(500);
        }
        if (!user){
            logger.debug(`User (email=${invitation.parentEmail}) does not exist!`);
            let errors = [];
            errors.push(createServerError('inviteEmail', 'Nu există utilizator cu acest email.'));
            res.json({errors:errors});
        } else {
            logger.silly(`Parent to be user = ${JSON.stringify(user)}`);
            let isParentAdult = validator.customValidators.isAgeGreaterThen18(user.birthDate);
            if (!isParentAdult){
                logger.debug(`User (email=${invitation.parentEmail}) is a minor`);
                let errors = [];
                errors.push(createServerError('inviteEmail', 'Păintele trebuie sa fie adult'));
                res.json({errors:errors});
            }else {
                //We need to check that the potential parent isn't a parent of the child already
                if(isUsersChild(user, {_id:invitation.child._id})){
                    logger.debug(`User (email=${invitation.parentEmail}) is already a parent of user (_id=${invitation.child._id})`);
                    let errors = [];
                    errors.push(createServerError('inviteEmail', 'Utilizatorul deja este parinte'));
                    res.json({errors:errors});
                } else {
                    //We check if a notification has not already been sent to this user
                    if(userHasAlreadyBeenNotifiedToBeParent(user.notifications, invitation.child._id)){
                        logger.debug(`User (email=${invitation.parentEmail}) is already received an invite to be a parent
                                      of user (_id=${invitation.child._id})`);
                        let errors = [];
                        errors.push(createServerError('inviteEmail', 'Exista deja o invitație trimisă către acest utilizator'));
                        res.json({errors:errors});
                    }else {
                        //We build the notification object
                        let notification = {};
                        notification.typeOfNot = keys.parentInviteNotification;
                        notification.data = {
                            firstName: invitation.child.firstName,
                            lastName: invitation.child.lastName,
                            alias: invitation.child.alias,
                            childId: invitation.child._id
                        };
                        User.addNotificationForUser(user._id, notification, function(err, user){
                            if(err){
                                logger.error(`Error adding notification for user (email=${invitation.parentEmail}):` + err);
                                return res.sendStatus(500);
                            }
                            res.json({success:true});
                        })
                    }
                }
            }
        }
    });
};

//Method for deleting a single notification for a user
module.exports.deleteNotificationForUser = function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.deleteNotificationForUserRoute} for ${helper.getUser(req)}`);
    let notificationId = req.body.notifId;
    User.deleteNotificationForUser(req.user._id, notificationId, function(err, user){
        if (err){
            logger.error(`Error deleting notification for ${helper.getUser(req)}:` + err);
            return res.sendStatus(500);
        }
        logger.silly(`User after deleting notification ${JSON.stringify(user)}`);
        res.json({success:true});
    })
};

//Method for deleteing a single notification for a user's child
module.exports.deleteNotificationForUsersChild = function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.deleteNotificationForUsersChildRoute} for ${helper.getUser(req)}`);
    let notificationId = req.body.notifId;
    let childId = req.body.childId;
    if(isUsersChild(req.user, {_id:childId})) {
        User.deleteNotificationForUser(childId, notificationId, function(err, childUser){
            if (err){
                logger.error(`Error deleting notification for the child (_id=${childId}) of ${helper.getUser(req)}:` + err);
                return res.sendStatus(500);
            }
            logger.silly(`User after deleting notification ${JSON.stringify(childUser)}`);
            res.json({success:true});
        })
    } else {
        logger.debug(`User (email=${getUser(req)}) doesn't have a child (_id=${childId})`);
        let errors = [];
        errors.push(createServerError(keys.deleteNotificationForUsersChildRoute, 'child is not parents\''));
        res.json({errors:errors});
    }

};

//Method for accepting a childs invitation to be a parent
module.exports.acceptChildInvite = function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.acceptChildInviteRoute} for ${helper.getUser(req)}`);
    let notificationId = req.body.notifId;
    User.findById(req.user._id, {notifications: true}, function(err, user){
        if (err){
            logger.error(`Error finding ${helper.getUser(req)}:` + err);
            return res.sendStatus(500);
        }
        let notification = getNotificationFromNotifications(user.notifications.notifications, notificationId);
        if(!notification){
            logger.error(`Notification with id ${notificationId} does not exist for ${helper.getUser(req)}`);
            let errors = [];
            errors.push(createServerError('notification', 'Notification does not exist.'));
            res.json({errors:errors});
        } else {
            logger.silly(`Found notification on user: ${JSON.stringify(notification)}`);
            //We delete the notification and add the child id to the parents' children array
            let childId = notification.data.childId;

            User.findOneAndUpdate({_id: req.user._id},
                {$pull: {'notifications.notifications': {_id: notificationId}}, $addToSet: {children: childId}},
                {firstName: true, lastName:true},
                function(err, user){
                    if (err){
                        logger.error(`Error deleting notification and adding child (childId=${childId})
                                   for ${helper.getUser(req)}:` + err);
                        return res.sendStatus(500);
                    }
                    logger.silly(`Updated the user with the notification and the child`);
                    //Create the notification for the child
                    let msg = `${user.firstName} ${user.lastName} ți-a acceptat invitația de a îți fii părinte pe
                                Coder Dojo Timișoara`;
                    let childNotification = helper.makeInfoNotification(msg);
                    childNotification.typeOfNot = keys.infoNotification;

                    //If we have been successful so far, we add the parent to the child, and a notification for the child
                    // that the parent has added it
                    User.findOneAndUpdate({_id: childId},
                        {$addToSet: {parents: req.user._id, 'notifications.notifications': childNotification}},
                        function(err, child){
                            if (err){
                                logger.error(`Error adding the notification and adding the parent to the child (childId=${childId})
                                   for ${helper.getUser(req)}:` + err);
                                return res.sendStatus(500);
                            }
                            res.json({success:true});
                        })
                })
        }
    })
};

//Function for getting the new notifications count for a user
module.exports.getNewNotificationsCount = function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.getNewNotificationsCountRoute} for ${helper.getUser(req)}`);
    User.getUserNotifications(req.user._id, function(err, user){
        if(err){
            logger.error(`Error getting new notifications for ${helper.getUser(req)}: ` + err);
            return res.sendStatus(500);
        }
        let newNotificationsCount = user.notifications? user.notifications.newNotificationCount : 0;
        res.json({newNotificationCount: newNotificationsCount});
    });
};

//Method for getting a users badges. It works for users getting badges for themselves, and for users getting badges
//for their children. The difference is that when getting the users childrens badges, a childId parameter is sent.
module.exports.getUsersBadges = function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.getUsersBadgesRoute} by ${helper.getUser(req)}`);
    let childId = req.body.childId;
    let user = req.user;
    let authorized = true;
    if(childId){
        //We are getting the badges for a users child, and we check if the user is the parent of the child
        if(!isUsersChild(user, {_id: childId})){
            authorized = false;
        }
    }

    if(authorized){
        let userId = childId ? childId : user._id;
        User.getBadgesOfUser(userId, function(err, userWithBadges){
           if(err){
               logger.error(`Error getting badges by ${helper.getUser(req)} for user (_id=${userId}: ` + err);
               return res.sendStatus(500);
           }
           res.json({badges: userWithBadges.badges, ownerOfBadges: userId});
        });
    } else {
        logger.error(`${helper.getUser(req)} tried get user's (_id:${childId}) badges while not authorized to do so.`);
        res.json({errors: keys.notAuthorizedError});
    }
};

//Module for uploading user photos
module.exports.uploadUserPicture = function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.uploadUserPictureRoute} for ${helper.getUser(req)}`);

    upload(req, res, function(err){
        if (err){
            logger.error(`Error uploading user photo for ${userToUpdatePhoto} by ${helper.getUser(req)}:` + err);
            return res.sendStatus(500);
        }
        let userToUpdatePhoto = req.body.userId;
        let user = req.user;
        //If the user changing the photo is the logged in user or if the user changing photo is the
        //logged in user's child
        if(user._id.toString() == userToUpdatePhoto || isUsersChild(user, {_id:userToUpdatePhoto})){
            let fileName = req.file.filename;
            User.updatePhotoForUser(userToUpdatePhoto, fileName, function(err){
                if(err){
                    logger.error(`Error updating user photo for for ${userToUpdatePhoto} by ${helper.getUser(req)}:` + err);
                    return res.sendStatus(500);
                }
                res.json({userPhoto:fileName, userId: userToUpdatePhoto});
                //TODO delete the old photo of the user
            })
        } else {
            //TODO we must delete the uploaded photo if the user is not authorized
            logger.error(` ${helper.getUser(req)} (children=${user.children}) tried to change photo for user _id=${userToUpdatePhoto} while not being the user or the users child`)
            res.json({errors:keys.wrongUserError});
        }
    })
};

let storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, __dirname + '/../client/img/user_photos');
    },
    filename: function (req, file, callback) {
        callback(null, `${req.body.userId}_${Date.now()}.${mime.extension(file.mimetype)}`);
    }
});

//TODO must check for photo type
upload =  multer({storage:storage}).single('user-photo');




function saveChildToDbsAndRegisterWithParent(req, res, child){
    logger.debug('Entering saveChildToDbsAndRegisterWithParent(req, res, child)');
    //If there are no errors we, save the new user
    let parent = req.user;
    child.password2 = undefined;
    child.parents = [parent._id];
    let newUser = new User(child);

    User.createUser(newUser, function(err, savedChild){
        if(err){
            logger.error('Error saving user in the database:' + err);
            return res.status(500).json({errors:keys.dbsUserCreationError})
        } else {
            //TODO register the child to the users' dojos
            //At this point the child user was saved
            logger.debug(`Child user saved email(${savedChild.email}), alias(${savedChild.alias})`);
            //We have to find the parent and add a reference to the saved child to it

            User.update({_id: parent._id}, {$addToSet: {children: savedChild._id}}, function(err){
                if(err){
                    //TODO what to do when a parent was not updated with the child reference
                    logger.error(`Parent (${parent.email}) not updated with the child (alias=${savedChild.alias}, email=${savedChild.alias})`);
                } else {
                    logger.debug(`Parent updated, responded with success.`);
                    res.json({success:true});
                    addChildToUsersDojos(parent._id.toString(), savedChild._id.toString());
                }
            });

        }
    });
}

//Method that takes a parentId and a childId(as strings) and adds the child to all the dojos the the parent is a member
//of as an attendee.
function addChildToUsersDojos(parentId, childId){
    Dojo.getUsersDojos(parentId, function(err, parentDojos){
        if(err){
            logger.error(`Error getting dojos by parent (id=${parentId}) for adding his child (id=${childId}) to his/her dojos`);
        }
        //We add the child to the dojos
        Dojo.addUsersChildToUsersDojos(childId, parentDojos, function(err){
            if(err){
                logger.error(`Error adding child (id=${childId}) by parent (id=${parentId}) to parents dojos`);
            }
        });

    })
}

//Method that returns the notification from an array of notificatios based on the id
function getNotificationFromNotifications(notifications, notificationId){
    if (notifications){
        for(let i = 0; i < notifications.length; i++){
            let notification = notifications[i];
            if(notification._id == notificationId){
                return notification;
            }
        }
    }
}

//Method for determining if a notification for parentage has already been sent to this user from this child
function userHasAlreadyBeenNotifiedToBeParent(notifications, childId){
    for(let i = 0; i < notifications.length; i++){
        let notification = notifications[i];
        if(notification.typeOfNot === keys.parentInviteNotification && notification.data._id == childId){
            return true;
        }
    }
}


//Method that validates the field for the register and for the modify user routes. Based on the flag "validationForWhat"
// it validates for various users and scenarios.
function validateFields(req, validationForWhat){
    logger.silly('Entering validateFields: validationForWhat=' + validationForWhat);

    let phone = req.body.user.phone;
    let password = req.body.user.password;
    let password2 = req.body.user.password2;
    let email = req.body.user.email;
    let alias = req.body.user.alias;

    //Validation
    req.checkBody("user.firstName", "Prenumele este necesar").notEmpty();
    req.checkBody("user.lastName", "Numele de familie este necesar").notEmpty();

    req.checkBody('user.birthDate', 'Ziua de nastere nu este completa').isDate();
    let isDate = req.body.user.birthDate ? true: false;
    logger.silly('isDate=' + isDate);
    req.checkBody('user.address', 'Lipseste adresa').notEmpty();
    req.checkBody('user.phone', "Numărul de telefon lipseste sau contine alte caractere").notEmpty();

    if (phone){
        req.checkBody('user.phone', "Numărul de telefon contine alte caractere decât cifre").isNumeric();
    }

    //Registering or editing a user by himself/herself
    if(validationForWhat === keys.regUserOver14Profile){
        logger.silly('validateFields(Reg/Edit user over 14 by himself/herself)');
        req.checkBody("user.email", "Email-ul este necesar").notEmpty();
        if(email){
            req.checkBody("user.email", "Email-ul nu este scris corect").isEmail();
        }
    }

    //Register user over 14 by himself/herself
    if (validationForWhat === keys.regUserOver14Profile){
        logger.silly('validateFields(Reg user over 14 by himself/herself)');
        req.checkBody("user.password", "Parola este necesara").notEmpty();
        if (password){
            req.checkBody("user.password", "Parola trebuie sa fie de minim 8 caractere si sa aibe cel putin o litera mare," +
                " una mica si o cifra").isPasswordValid();
        }

        req.checkBody("user.password2", "Parola nu e aceeași").equals(req.body.user.password);

        if(isDate){
            req.checkBody('user.birthDate', 'Ne pare rau, trebuie sa ai peste 14 ani pentru a iti creea cont')
                .isAgeGreaterThen14();
        }
    }

    //Edit user over 14 by himself/herself
    if(validationForWhat === keys.editUserOver14Profile){
        logger.silly('validateFields(Edit user over 14 by himself/herself)');
        if(isDate){
            req.checkBody('user.birthDate', 'Ne pare rau, trebuie sa ai peste 14 ani').isAgeGreaterThen14();
        }
    }

    //Register or Edit child younger than 14 by parent
    if(validationForWhat === keys.editChildUnder14Profile ||
        validationForWhat === keys.regChildUnder14Profile){
        logger.silly('validateFields(Reg/Edit child under 14 by parent)');
        if(isDate){
            req.checkBody('user.birthDate', 'Ne pare rau, copilul trebuie sa aibe sub 14 ani')
                .isAgeLessThen14();
        }

        req.checkBody('user.alias', 'Aliasul este necesar').notEmpty();
        if(alias){
            req.checkBody('user.alias', 'Aliasul poate conține doar caractere [A-Z,a-z,0-9]').isAliasValid();
        }
    }

    //Register child older than 14 by parent
    if(validationForWhat === keys.regChildOver14Profile){
        logger.silly('validateFields(Reg child over 14 by parent)');
        req.checkBody('user.alias', 'Aliasul este necesar').notEmpty();
        if(alias){
            req.checkBody('user.alias', 'Aliasul poate conține doar caractere [A-Z,a-z,0-9]').isAliasValid();
        }

        if(isDate){
            req.checkBody('user.birthDate', 'Varsta trebuie sa fie intre 14 si 18 ani')
                .isAgeBetween14and18();
        }

        if(password || password2){
            req.checkBody("user.password", "Parola este necesara").notEmpty();
            req.checkBody("user.password", "Parola trebuie sa fie de minim 8 caractere si sa aibe cel putin o litera mare," +
                " una mica si o cifra").isPasswordValid();

            req.checkBody("user.password2", "Parola incorecta").equals(req.body.user.password);
        }
    }

    //Edit child older than 14 by parent
    if(validationForWhat === keys.editChildOver14Profile){
        logger.silly('validateFields(Edit child over 14 by parent)');
        if(isDate){
            req.checkBody('user.birthDate', 'Varsta trebuie sa fie intre 14 si 18 ani')
                .isAgeBetween14and18();
        }

        if(password || password2){
            req.checkBody("user.password", "Parola este necesara").notEmpty();
            req.checkBody("user.password", "Parola trebuie sa fie de minim 8 caractere si sa aibe cel putin o litera mare," +
                " una mica si o cifra").isPasswordValid();
            req.checkBody("user.password2", "Parola incorecta").equals(req.body.user.password);
        }

        if(!email){
            //If the child doesn't have email, the child must have an alias
            if(req.checkBody('user.alias', 'Aliasul este necesar').notEmpty()){
                req.checkBody('user.alias', 'Aliasul poate conține doar caractere [A-Z,a-z,0-9]').isAliasValid();
            }
        } else {
            if(req.checkBody("user.email", "Email-ul este necesar").notEmpty()){
                req.checkBody("user.email", "Email-ul nu este scris corect").isEmail();
            }
        }
    }
    let errors = req.validationErrors();
    logger.silly('validateErrors(errors=' + JSON.stringify(errors) + ')');

    return req.validationErrors();
}

//Function that formats the error message to a format that the client knows to read
function createServerError(errorType, errorMessage){
    let error = {};
    error.param = 'user[' + errorType + ']';
    error.msg = errorMessage;
    return error;
}

//Function that determine if a child is a users child
module.exports.isUsersChild = isUsersChild = function (user, child){
    return helper.isUsersChild(user, child);
};
//This method is used to restrict the fields that are modified when a user edits his profile
function selectUserFieldsForSaving(user){
    return {
        firstName: user.firstName,
        lastName: user.lastName,
        birthDate: user.birthDate,
        address: user.address,
        phone: user.phone,
        facebook: user.facebook,
        linkedin: user.linkedin,
        languagesSpoken: user.languagesSpoken,
        programmingLanguages: user.programmingLanguages,
        biography: user.biography,
        gender: user.gender
    };
}




