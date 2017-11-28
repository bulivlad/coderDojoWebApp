/**
 * Created by Adina Paraschiv on 4/8/2017.
 */

const keys = require('../static_keys/project_keys');
const User = require('../models/userModel');
const Dojo = require('../models/dojoModel');
const bcrypt = require('bcryptjs');
const logger = require('winston');
const customValidator = require('../validator/validator');
const multer = require('multer');
const mime = require('mime');
const helper = require('./helperController');
const validator = require('validator');
let upload;

//Method for registering user
module.exports.registerUser = function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.register} for user (email=${req.body.user.email},
                   alias=${req.body.user.email})`);
    //First we validate and sanitize the user fields received from the client
    let errors = validateFields(req, keys.regUserOver14Profile);
    if (errors){
        //If there are errors, we sent them back to the client
        res.json({errors: errors})
    } else {
        let user = req.body.user;
        //If all the fields of the user object are filled, we need to sanitize them
        let sanitizedUser = sanitizeUserForRegistration(user);
        if(areUsersEqual(user, sanitizedUser)){
            //If the sanitization process has not modified the user, we save him
            //No validation errors at this point
            //Fist we check if the the email is already in use
            User.searchForUserByEmail(user.email, function(err, result){
                if (err){
                    logger.error(`Error seaching for existing email (${user.email}) for registering user: ` + err);
                    return res.sendStatus(500);
                }
                if(result){
                    //If we already find an entry with this email we send an error to the client that the email is already in use
                    errors = [];
                    errors.push(createServerError('email', 'Cont existent'));
                    res.json({errors:errors});
                    logger.info("An account with this email already exists: " + (req.body.user.email));
                } else {
                    User.checkIfAliasExists(user.alias, function(err, result){
                        if (err){
                            logger.error(`Error seaching for existing email (${user.email}) for registering user: ` + err);
                            return res.sendStatus(500);
                        }
                        if (result){
                            //If we already find an entry with this alias we send an error to the client that the alias is already in use
                            errors = [];
                            errors.push(createServerError('alias', 'Alias existent pentru un alt utilizator'));
                            res.json({errors:errors});
                            logger.info("An account with this alias already exists: " + (req.body.user.alias));
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
                    })
                }
            });
        } else {
            //IF there were modifications made by the sanitization process, we send the sanitized user back to the client
            res.json({sanitizedUser: sanitizedUser});
        }
    }
};

module.exports.registerUsersChild = function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.registerChildRoute} for ${helper.getUser(req)}`);
    let childUser = req.body.user;
    let childUserType = childUser.userType;
    let errors = validateFields(req, childUserType);
    if (errors){
        res.json({errors: errors})
    } else {
        //No validation errors at this point
        let sanitizedChild = sanitizeUserForRegistration(childUser);
        //If the sanitization process has not changed anything we continue with the process
        if (areUsersEqual(sanitizedChild, childUser)) {
            //We make sure the alias is unique
            User.checkIfAliasExists(childUser.alias, function (err, aliasFound) {
                if (err) {
                    logger.error('Error seaching database for alias (' + childUser.alias + ') : ' + err);
                    return res.sendStatus(500);
                }
                else if (aliasFound) {
                    //If we already find an entry with this alias
                    errors = [];
                    errors.push(createServerError('alias', 'Alias existent'));
                    res.json({errors: errors});
                    logger.debug("An account with this alias already exists: " + (childUser.alias));
                } else {
                    //We must make sure the email is unique as well
                    if (childUser.email) {
                        User.checkIfEmailExists(childUser.email, function (err, emailFound) {
                            if (err) {
                                logger.error('Error seaching database for email(' + childUser.email + ') : ' + err);
                                return res.status(500).json({errors: keys.dbsUserCreationError})
                            }
                            else if (emailFound) {
                                //If we already find an entry with this email
                                errors = [];
                                errors.push(createServerError('email', 'Email existent'));
                                res.json({errors: errors});
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
        } else {
            //IF the sanitization process has changed the user, we return the sanitized user to the client
            res.json({sanitizedUser: sanitizedChild});
        }
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
    if(req.user && req.user.parents && req.user.parents.length > 0){
        User.find({_id: {$in: req.user.parents}}, {password: false, creationDate: false},function(err, expandedParents){
            if (err){
                logger.error('Could not get parents: ' + err);
                return res.sendStatus(500);
            }
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
    User.find({_id: {$in: parents}},
        {password: false, creationDate: false, children:false, parents:false, badges:false, notifications: false},
        function(err, childsParents){
            if (err){
                logger.error('Could not get parents: ' + err);
                return res.sendStatus(500);
            }
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
    let editedUser = req.body.user;
    let user = req.user;
    //We check that the user editing the account is the logged in user
    if (!helper.isSameUser(user, editedUser)){
        res.json({errors:keys.notAuthorizedError});
        logger.error(`${helper.getUser(req)} tried to modify user (${JSON.stringify(editedUser)}) while not being that user.` + `
                route is ${keys.editUser}`);
    } else {
        let errors = validateFields(req, keys.editUserOver14Profile);
        if (errors){
            res.json({errors:errors});
        } else {
            let sanitizedEditedUser = sanitizeUserForEditing(editedUser);
            if(areUsersEqual(editedUser, sanitizedEditedUser)){
                User.updateUser(user, selectUserFieldsForSaving(editedUser), function(err){
                    if (err){
                        logger.error(`Error saving modifications ${helper.getUser(req)}, modifications ` +
                            `=((${JSON.stringify(editedUser)})): ` + err);
                        return res.sendStatus(500);
                    }
                    res.json({success: true});
                });
            } else {
                res.json({sanitizedUser: sanitizedEditedUser});
            }
        }
    }
};

//Method for editing a user's child
module.exports.editUsersChild = function(req, res){
    let usersChild = req.body.user;
    let user = req.user;
    //We check that the user editing the child is its parent
    if (!isUsersChild(req.user, usersChild)){
        res.json({errors:keys.notAuthorizedError});
        logger.error(`${helper.getUser(req)} (children =${JSON.stringify(user.children)} ) tried to modify user ` +
            ` (${JSON.stringify(usersChild)}) while not being that users parent. route is ${keys.editUsersChild}`);
    } else {
        let errors = validateFields(req, usersChild.userType);
        if (errors){
            res.json({errors:errors});
        } else {
            let sanitizedEditedChild = sanitizeUserForEditing(usersChild);
            if(areUsersEqual(usersChild, sanitizedEditedChild)){
                User.updateUser(usersChild, selectUserFieldsForSaving(usersChild), function(err){
                    if (err){
                        logger.error(`Error editing child user (${JSON.stringify(usersChild)} by: ${helper.getUser(req)} ` + err);
                        return res.sendStatus(500);
                    } else {
                        res.json({success: true});
                    }
                });
            } else {
                res.json({sanitizedUser: sanitizedEditedChild});
            }
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
        if(user){
            logger.debug(`Notifications for ${helper.getUser(req)} are: ` + JSON.stringify(user.notifications));
            let usersNotifications = user.notifications ? user.notifications.notifications: [];
            res.json({
                notificationObject:{
                    ownerOfNotifications: req.user._id,
                    notifications: usersNotifications
                }
            })
        } else {
            logger.error(`User's id=${helper.getUser(req)} not found in database to get his/her notification`);
            return res.sendStatus(500);
        }

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
    let invitation = req.body.invitation;

    User.findOne({email: invitation.parentEmail},{children: true, birthDate: true, notifications: true}, function(err, user){
        if(err){
            logger.error(`Error searching database for user (email=${invitation.parentEmail}), for childInvitation:` + err);
            return res.sendStatus(500);
        }
        if (!user){
            let errors = [];
            errors.push(createServerError('inviteEmail', 'Nu există utilizator cu acest email.'));
            res.json({errors:errors});
        } else {
            let isParentAdult = customValidator.customValidators.isAgeGreaterThen18(user.birthDate);
            if (!isParentAdult){
                let errors = [];
                errors.push(createServerError('inviteEmail', 'Păintele trebuie sa fie adult'));
                res.json({errors:errors});
            }else {
                //We need to check that the potential parent isn't a parent of the child already
                if(isUsersChild(user, {_id:invitation.child._id})){
                    let errors = [];
                    errors.push(createServerError('inviteEmail', 'Utilizatorul deja este parinte'));
                    res.json({errors:errors});
                } else {
                    //We check if a notification has not already been sent to this user
                    if(userHasAlreadyBeenNotifiedToBeParent(user.notifications, invitation.child._id)){
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
//for their children. The difference is that when getting the users children's badges, a childId parameter is sent.
module.exports.getUsersBadges = function(req, res){
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
        let userToUpdatePhoto = req.body.userId;
        if (err){
            logger.error(`Error uploading user photo for ${userToUpdatePhoto} by ${helper.getUser(req)}:` + err);
            return res.sendStatus(500);
        }
        let fileName = req.file.filename;
        let user = req.user;
        //If the user changing the photo is the logged in user or if the user changing photo is the
        //logged in user's child

        let userImagesRelativePath =  'client/img/user_photos/user_uploaded/';
        logger.debug(`userToUpdatePhoto=${userToUpdatePhoto}`);

        if(user._id.toString() == userToUpdatePhoto || isUsersChild(user, {_id:userToUpdatePhoto})){
            helper.inspectUploadedImage(req.file, userImagesRelativePath, function(err, fileInspect){
                if(err){
                    logger.error(`Error inspecting photo (_id=${JSON.stringify(req.file)}) for adding user photo  ` +
                        `for user (_id=${userToUpdatePhoto}) by ${helper.getUser(req)}: ` + err);
                    return res.sendStatus(500);
                    helper.deletePhoto(userImagesRelativePath +  filename);
                }
                let filename = req.file.filename;
                if(fileInspect.fileSize > 500000){
                    //If the file is larger than 500Kb it is not acceptable
                    res.json({errors:keys.uploadedPhotoTooLargeError});
                    //We delete the photo after it has been uploaded
                    helper.deletePhoto(userImagesRelativePath +  filename);
                } else if((fileInspect.mimeType != 'image/jpeg') && (fileInspect.mimeType != 'image/png')){
                    //Not a correct type of file
                    res.json({errors:keys.uploadedPhotoNotCorrectMimeTypeError});
                    //We delete the photo after it has been uploaded
                    helper.deletePhoto(userImagesRelativePath +  filename);
                } else {
                    //If the file is the right size and the correct mime type, we save the file
                    User.updatePhotoForUser(userToUpdatePhoto, fileName, function(err, oldUser){
                        if(err){
                            logger.error(`Error updating user photo for for ${userToUpdatePhoto} by ${helper.getUser(req)}:` + err);
                            return res.sendStatus(500);
                        }
                        res.json({userPhoto:fileName, userId: userToUpdatePhoto});
                        helper.deletePhoto(userImagesRelativePath +  oldUser.userPhoto);
                    })
                }
            });
        } else {
            logger.error(` ${helper.getUser(req)} (children=${user.children}) tried to change photo for ` +
                `user _id=${userToUpdatePhoto} while not being the user or the users child (not authorized)`);
            res.json({errors:keys.wrongUserError});
            helper.deletePhoto(userImagesRelativePath +  fileName);
        }
    })
};

let storage = multer.diskStorage({
    destination: function (req, file, callback) {
        let dirURI = __dirname + '/../client/img/user_photos/user_uploaded';
        callback(null, dirURI);
    },
    filename: function (req, file, callback) {
        callback(null, `${req.body.userId}_${Date.now()}.${mime.extension(file.mimetype)}`);
    }
});

upload =  multer({storage:storage}).single('user-photo');


//Method that informs the user on what he/she can change in their account (alias and email)
module.exports.getChangeUserIdentificationInfo = function(req, res){
    let user = req.user;
    let userToChangeInfoId = req.body.userId;
    //We verify that the user is authorized to get this info
    if(helper.isSameUser(user, {_id:userToChangeInfoId}) || helper.isUsersChild(user, {_id:userToChangeInfoId})){
        User.getChangeUserIdentificationInfo(userToChangeInfoId, function(err, userFromDb){
            if (err){
                logger.error(`Error getting user change identification information by ${helper.getUser(req)}, for ` +
                    `user (_id=${userToChangeInfoId}):` + err);
                return res.sendStatus(500);
            }

            let showChangeEmail = canUserHaveEmail(userFromDb);

            res.json({changeInfo: {oldEmail: userFromDb.email, oldAlias:userFromDb.alias, showChangeEmail: showChangeEmail}});
        })

    } else {
        logger.error(`${helper.getUser(req)} tried to get information to change email or alias for user ` +
            `(id=${userToChangeInfoId} not authorized to do so`);
        res.json({errors:keys.notAuthorizedError});
    }
};

//Method for changing a users alias
//Method that informs the user on what he/she can change in their account (alias and email)
module.exports.changeUserAlias = function(req, res){
    let user = req.user;
    let userToChangeInfoId = req.body.userId;
    let newAlias = req.body.newAlias;
    //We verify that the user is authorized to get this info
    if(helper.isSameUser(user, {_id:userToChangeInfoId}) || helper.isUsersChild(user, {_id:userToChangeInfoId})){
        //If for some reason no new alias arrives at the server, we sent a validation error back
        if(!newAlias){
            return res.json({errors: {newAlias: 'Aliasul lipseste'}});
        }

        let sanitizedNewAlias = sanitizeAlias(newAlias);
        if(sanitizedNewAlias == newAlias){
            User.checkIfAliasExists(sanitizedNewAlias, function(err, aliasExists){
                if(err){
                    logger.error(`Error checking if alias ${newAlias} exists by ${helper.getUser(req)}, for ` +
                        `user (_id=${userToChangeInfoId}):` + err);
                    return res.sendStatus(500);
                }
                if(aliasExists){
                    return res.json({errors: {newAlias: 'Aliasul exista deja.'}})
                }

                User.changeUsersAlias(sanitizedNewAlias, userToChangeInfoId, function(err){
                    if(err){
                        logger.error(`Error modifying the alias (new alias= ${newAlias}) of  ` +
                            `user (_id=${userToChangeInfoId}) by ${helper.getUser(req)}:` + err);
                        return res.sendStatus(500);
                    }
                    res.json({success: true});
                })
            })

        } else {
            res.json({sanitizedNewAlias: sanitizedNewAlias});
        }
    } else {
        logger.error(`${helper.getUser(req)} tried to  change  alias for user ` +
            `(id=${userToChangeInfoId} not authorized to do so`);
        res.json({errors:keys.notAuthorizedError});
    }
};

module.exports.changeUserEmail = function(req, res){
    let user = req.user;
    let userToChangeInfoId = req.body.userId;
    let newEmail = req.body.newEmail;
    //We verify that the user is authorized to get this info
    if(helper.isSameUser(user, {_id:userToChangeInfoId}) || helper.isUsersChild(user, {_id:userToChangeInfoId})){
        //We check to make sure we do not add an email to a user that does not have the required age (fail safe)
        User.getChangeUserIdentificationInfo(userToChangeInfoId, function(err, userFromDb){
            if (err){
                logger.error(`Error getting user age info for changing email by ${helper.getUser(req)}, for ` +
                    `user (_id=${userToChangeInfoId}):` + err);
                return res.sendStatus(500);
            }
            //If the user has the correct age we go ahead
            if(canUserHaveEmail(userFromDb)){
                //If for some reason no new email arrives at the server, we sent a validation error back
                if(!newEmail){
                    return res.json({errors: {newEmail: 'Email-ul lipseste'}});
                } else if(!validator.isEmail(newEmail)){
                    return res.json({errors: {newEmail: 'Email-ul nu are formatul corect'}});
                }

                let sanitizedNewEmail = sanitizeEmail(newEmail);
                if(sanitizedNewEmail == newEmail){
                    User.checkIfEmailExists(sanitizedNewEmail, function(err, emailExists){
                        if(err){
                            logger.error(`Error checking if email ${newEmail} exists by ${helper.getUser(req)}, for ` +
                                `user (_id=${userToChangeInfoId}):` + err);
                            return res.sendStatus(500);
                        }
                        if(emailExists){
                            return res.json({errors: {newEmail: 'Email-ul exista deja.'}})
                        }

                        User.changeUsersEmail(sanitizedNewEmail, userToChangeInfoId, function(err){
                            if(err){
                                logger.error(`Error modifying the email (new email= ${newEmail}) of  ` +
                                    `user (_id=${userToChangeInfoId}) by ${helper.getUser(req)}:` + err);
                                return res.sendStatus(500);
                            }
                            res.json({success: true});
                        })
                    })

                } else {
                    res.json({sanitizedNewEmail: sanitizedNewEmail});
                }
            } else {
                logger.error(`${helper.getUser(req)} tried to change email for user ` +
                    `(id=${userToChangeInfoId}) while the user (id=${userToChangeInfoId}) was under 14`);
                res.json({errors:keys.notAuthorizedError});
            }

        })
    } else {
        logger.error(`${helper.getUser(req)} tried to change email for user ` +
            `(id=${userToChangeInfoId}) not authorized to do so`);
        res.json({errors:keys.notAuthorizedError});
    }
};


function canUserHaveEmail(user){
    return customValidator.customValidators.isAgeGreaterThen14(user.birthDate);
}

function canUserHavePassword(user){
    return customValidator.customValidators.isAgeGreaterThen14(user.birthDate);
}


//Method that informs the user on what he/she can change in their account (alias and email)
module.exports.getChangeUserPasswordInfo = function(req, res){
    let user = req.user;
    let userToChangeInfoId = req.body.userId;
    //We verify that the user is authorized to get this info
    if(helper.isSameUser(user, {_id:userToChangeInfoId}) || helper.isUsersChild(user, {_id:userToChangeInfoId})){
        User.getChangeUserPasswordInfo(userToChangeInfoId, function(err, userFromDb){
            if (err){
                logger.error(`Error getting user change password information by ${helper.getUser(req)}, for ` +
                    `user (_id=${userToChangeInfoId}):` + err);
                return res.sendStatus(500);
            }

            let hasPassword = userFromDb.password ? true: false;


            res.json({changeInfo: {hasPassword: hasPassword}});
        })

    } else {
        logger.error(`${helper.getUser(req)} tried to get information to change email or alias for user ` +
            `(id=${userToChangeInfoId} not authorized to do so`);
        res.json({errors:keys.notAuthorizedError});
    }
};

module.exports.changeUserPassword = function(req, res){
    let user = req.user;
    let userToChangeInfoId = req.body.userId;
    let oldPassword = req.body.oldPassword;
    let newPassword = req.body.newPassword;
    let newPassword2 = req.body.newPassword2;
    //We verify that the user is authorized to get this info
    if(helper.isSameUser(user, {_id:userToChangeInfoId}) || helper.isUsersChild(user, {_id:userToChangeInfoId})){
        //We check to make sure we do not add an email to a user that does not have the required age (fail safe)
        User.getChangeUserPasswordInfo(userToChangeInfoId, function(err, userFromDb){
            if (err){
                logger.error(`Error getting password info for changing password by ${helper.getUser(req)}, for ` +
                    `user (_id=${userToChangeInfoId}):` + err);
                return res.sendStatus(500);
            }


            if(userFromDb.password){
                //If the user already has a password, we compare the password in the database with the one provided by the
                //user
                bcrypt.compare(oldPassword, userFromDb.password, function (err, isMatch) {
                    if (err) {
                        logger.error('Error comparing passwords with bcrypt for changing user password: ' + err);
                        return res.sendStatus(500);
                    }
                    //If the passwords match we save the user
                    if (isMatch) {
                        saveUsersNewPassword(req, res, userToChangeInfoId, newPassword, newPassword2);
                    } else {
                        res.json({errors:{oldPassword: 'Parola veche nu este corecta.'}});
                    }
                })

            } else {
                //IF the user in the database does not have a password yet (a child user)
                if(newPassword){
                    //We check if the user can have a password (age > 14) (this is a fail-safe)
                    if(canUserHavePassword(userFromDb)){
                        saveUsersNewPassword(req, res, userToChangeInfoId, newPassword, newPassword2);
                    } else {
                        logger.error(`${helper.getUser(req)} tried to add password for user ` +
                            `(id=${userToChangeInfoId}) while the user (id=${userToChangeInfoId}) was under 14`);
                        res.json({errors:keys.notAuthorizedError});
                    }
                } else {
                    //IF no new password was sent (this is a fail safe)
                    res.json({errors: {newPassword: 'Parola noua lipseste'}});
                }
            }

        })
    } else {
        logger.error(`${helper.getUser(req)} tried to change email for user ` +
            `(id=${userToChangeInfoId} not authorized to do so`);
        res.json({errors:keys.notAuthorizedError});
    }
};

function saveUsersNewPassword(req, res, userToChangeInfoId, newPassword, newPassword2){
    let errors = validatePassword(newPassword);
    if(errors) {
        res.json({errors:errors});
    } else {
        //If the new passwords passed validation
        let sanitizedNewPassword = sanitizePassword(newPassword);
        if (sanitizedNewPassword == newPassword) {
            //We now check if the newPassword matches newPassword2
            if (sanitizedNewPassword === newPassword2) {
                bcrypt.genSalt(10, function (err, salt) {
                    if (err) {
                        logger.error(`Error obtaining salt for changing user (${res.body.userId})  by ${helper.getUser(req)} ` +
                            `password: ` + err);
                        return res.sendStatus(500);
                    }
                    bcrypt.hash(sanitizedNewPassword, salt, function (err, hashOfNewPassword) {
                        if (err) {
                            logger.error(`Error obtaining hashing password for changing user (${res.body.userId})  by ${helper.getUser(req)} ` +
                                `password: ` + err);
                            return res.sendStatus(500);
                        }
                        User.changeUsersPassword(hashOfNewPassword, userToChangeInfoId, function (err) {
                            if (err) {
                                logger.error(`Error saving hased password for changing user (${res.body.userId})  by ${helper.getUser(req)} ` +
                                    `password: ` + err);
                                return res.sendStatus(500);
                            }
                            res.json({success: true});
                        })
                    });
                });
            } else {
                res.json({errors: {newPassword2: 'Confirmarea parolei nu e buna'}});
            }
        } else {
            //IF the sanitizedNewPassword isn't equal to the newPassword
            res.json({sanitizedNewPassword: true});
        }
    }
}

function validatePassword(newPassword){
    let errors = {};
    let hasErrors = false;
    if(!customValidator.customValidators.isPasswordValid(newPassword)){
        errors.newPassword = 'Parola trebuie sa fie de minim 8 caractere si sa aibe cel putin o litera mare,' +
            ' una mica si o cifra';
        hasErrors = true;
    }
    if(hasErrors){
        return errors;
    }
}

function saveChildToDbsAndRegisterWithParent(req, res, child){
    logger.debug('Entering saveChildToDbsAndRegisterWithParent(req, res, child)');
    //If there are no errors we, save the new user
    let parent = req.user;
    child.password2 = undefined;
    child.parents = [parent._id];
    let newUser = new User(child);

    let sanitizedChild = sanitizeUserForRegistration(child);
    if(areUsersEqual(child, sanitizedChild)){
        User.createUser(newUser, function(err, savedChild){
            if(err){
                logger.error(`Error saving child (${JSON.stringify(child)}) by ${helper.getUser(req)} in the database:` + err);
                return res.status(500).json({errors:keys.dbsUserCreationError})
            } else {
                //We have to find the parent and add a reference to the saved child to it
                User.update({_id: parent._id}, {$addToSet: {children: savedChild._id}}, function(err){
                    if(err){
                        //TODO what to do when a parent was not updated with the child reference
                        logger.error(`Parent (${parent.email}) not updated with the child (alias=${savedChild.alias}, email=${savedChild.alias})`);
                    } else {
                        res.json({success:true});
                        addChildToUsersDojos(parent._id.toString(), savedChild._id.toString());
                    }
                });

            }
        });
    } else {
        res.json({sanitizedUser: sanitizedChild});
    }


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
    req.checkBody("user.alias", "Alias-ul este necesar").notEmpty();

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


function sanitizeUserForRegistration(user){
    let retUser = {};

    //Registering a child, you can have a user with no email
    if(user.email){
        retUser.email = sanitizeEmail(user.email);
    }

    //Registering a child, you can have a child with no password
    if(user.password){
        let sanitPassword = helper.removeWhiteSpaces(user.password);
        if(sanitPassword.length > 20){
            sanitPassword = sanitPassword.substring(0, 20);
        }

        //IF the password has been modified, we reset it
        if(sanitPassword != user.password){
            sanitPassword = '';
        }
        retUser.password = sanitPassword;

        //Password 2 is kept as it is
        retUser.password2 = user.password2;
    }

    if(user.alias){
        let sanitAlias = validator.trim(user.alias);
        if(sanitAlias.length > 50){
            sanitAlias = sanitAlias.substring(0, 50);
        }
        retUser.alias = sanitAlias;
    }

    if(user.facebook){
        let sanitFacebook = validator.trim(user.facebook);
        if(sanitFacebook.length > 100){
            sanitFacebook = sanitFacebook.substring(0, 100);
        }
        sanitFacebook = validator.whitelist(sanitFacebook, helper.linkWhiteList);
        retUser.facebook = sanitFacebook;
    }

    if(user.linkedin){
        let sanitLinkedIn = validator.trim(user.linkedin);
        if(sanitLinkedIn.length > 100){
            sanitLinkedIn = sanitLinkedIn.substring(0, 100);
        }
        sanitLinkedIn = validator.whitelist(sanitLinkedIn, helper.linkWhiteList);
        retUser.linkedin = sanitLinkedIn;
    }

    if(user.languagesSpoken){
        let sanitLanguagesSpoken = validator.trim(user.languagesSpoken);
        if(sanitLanguagesSpoken.length > 100){
            sanitLanguagesSpoken = sanitLanguagesSpoken.substring(0, 100);
        }
        sanitLanguagesSpoken = validator.whitelist(sanitLanguagesSpoken, helper.userNameWhitelist);
        retUser.languagesSpoken = sanitLanguagesSpoken;
    }

    if(user.programmingLanguages){
        let sanitProgrammingLanguages = validator.trim(user.programmingLanguages);
        if(sanitProgrammingLanguages.length > 100){
            sanitProgrammingLanguages = sanitProgrammingLanguages.substring(0, 100);
        }
        sanitProgrammingLanguages = validator.whitelist(sanitProgrammingLanguages, helper.userNameWhitelist);
        retUser.programmingLanguages = sanitProgrammingLanguages;
    }

    if(user.biography){
        let sanitBiography = validator.trim(user.biography);
        if(sanitBiography.length > 100){
            sanitBiography = sanitBiography.substring(0, 100);
        }
        sanitBiography = validator.whitelist(sanitBiography, helper.userNameWhitelist);
        retUser.biography = sanitBiography;
    }

    if(user.gender){
        let sanitGender = validator.trim(user.gender);
        if(sanitGender.length > 100){
            sanitGender = sanitGender.substring(0, 100);
        }
        sanitGender = validator.whitelist(sanitGender, helper.userNameWhitelist);
        retUser.gender = sanitGender;
    }

    if(helper.isDate(user.birthDate)){
        retUser.birthDate  =user.birthDate;
    }

    let sanitAddress = validator.trim(user.address);
    if(sanitAddress.length > 100){
        sanitAddress = sanitAddress.substring(0, 100);
    }
    sanitAddress = validator.whitelist(sanitAddress, helper.eventWhiteListNames);
    retUser.address = sanitAddress;

    let sanitPhone = validator.trim(user.phone);
    if(sanitPhone.length > 20){
        sanitPhone = sanitPhone.substring(0, 20);
    }
    sanitPhone = validator.whitelist(sanitPhone, helper.phoneWhiteList);

    let sanitFirstName = validator.trim(user.firstName);
    if(sanitFirstName.length > 50){
        sanitFirstName = sanitFirstName.substring(0, 50);
    }
    sanitFirstName = validator.whitelist(sanitFirstName, helper.userNameWhitelist);
    retUser.firstName = sanitFirstName;

    let sanitLastName = validator.trim(user.lastName);
    if(sanitLastName.length > 50){
        sanitLastName = sanitLastName.substring(0, 50);
    }
    sanitLastName = validator.whitelist(sanitLastName, helper.userNameWhitelist);
    retUser.lastName = sanitLastName;

    retUser.phone = sanitPhone;
    return retUser;
}

function areUsersEqual(user1, user2){
    let ret = true;
    if(user1.email !== user2.email){
        ret = false;
    } else if(user1.alias !== user2.alias){
        ret = false;
    }else if(user1.password !== user2.password){
        ret = false;
    } else if(user1.firstName !== user2.firstName){
        ret = false;
    } else if(user1.lastName !== user2.lastName){
        ret = false;
    } else if(user1.birthDate !== user2.birthDate){
        ret = false;
    } else if(user1.address !== user2.address){
        ret = false;
    } else if(user1.phone !== user2.phone){
        ret = false;
    } else if(user1.facebook !== user2.facebook){
        ret = false;
    } else if(user1.linkedin !== user2.linkedin){
        ret = false;
    } else if(user1.languagesSpoken !== user2.languagesSpoken){
        ret = false;
    } else if(user1.programmingLanguages !== user2.programmingLanguages){
        ret = false;
    } else if(user1.biography !== user2.biography){
        ret = false;
    }

    return ret;
}


function sanitizeUserForEditing(user){
    let retUser = {};

    if(helper.isDate(user.birthDate)){
        retUser.birthDate  =user.birthDate;
    }

    let sanitAddress = validator.trim(user.address);
    if(sanitAddress.length > 100){
        sanitAddress = sanitAddress.substring(0, 100);
    }
    sanitAddress = validator.whitelist(sanitAddress, helper.eventWhiteListNames);
    retUser.address = sanitAddress;

    let sanitPhone = validator.trim(user.phone);
    if(sanitPhone.length > 20){
        sanitPhone = sanitPhone.substring(0, 20);
    }
    sanitPhone = validator.whitelist(sanitPhone, helper.phoneWhiteList);
    retUser.phone = sanitPhone;

    let sanitFirstName = validator.trim(user.firstName);
    if(sanitFirstName.length > 50){
        sanitFirstName = sanitFirstName.substring(0, 50);
    }
    sanitFirstName = validator.whitelist(sanitFirstName, helper.userNameWhitelist);
    retUser.firstName = sanitFirstName;

    let sanitLastName = validator.trim(user.lastName);
    if(sanitLastName.length > 50){
        sanitLastName = sanitLastName.substring(0, 50);
    }
    sanitLastName = validator.whitelist(sanitLastName, helper.userNameWhitelist);
    retUser.lastName = sanitLastName;

    if(user.facebook){
        let sanitFacebook = validator.trim(user.facebook);
        if(sanitFacebook.length > 100){
            sanitFacebook = sanitFacebook.substring(0, 100);
        }
        sanitFacebook = validator.whitelist(sanitFacebook, helper.linkWhiteList);
        retUser.facebook = sanitFacebook;
    }

    if(user.linkedin){
        let sanitLinkedIn = validator.trim(user.linkedin);
        if(sanitLinkedIn.length > 100){
            sanitLinkedIn = sanitLinkedIn.substring(0, 100);
        }
        sanitLinkedIn = validator.whitelist(sanitLinkedIn, helper.linkWhiteList);
        retUser.linkedin = sanitLinkedIn;
    }

    if(user.languagesSpoken){
        let sanitLanguagesSpoken = validator.trim(user.languagesSpoken);
        if(sanitLanguagesSpoken.length > 100){
            sanitLanguagesSpoken = sanitLanguagesSpoken.substring(0, 100);
        }
        sanitLanguagesSpoken = validator.whitelist(sanitLanguagesSpoken, helper.userNameWhitelist);
        retUser.languagesSpoken = sanitLanguagesSpoken;
    }

    if(user.programmingLanguages){
        let sanitProgrammingLanguages = validator.trim(user.programmingLanguages);
        if(sanitProgrammingLanguages.length > 100){
            sanitProgrammingLanguages = sanitProgrammingLanguages.substring(0, 100);
        }
        sanitProgrammingLanguages = validator.whitelist(sanitProgrammingLanguages, helper.userNameWhitelist);
        retUser.programmingLanguages = sanitProgrammingLanguages;
    }

    if(user.biography){
        let sanitBiography = validator.trim(user.biography);
        if(sanitBiography.length > 100){
            sanitBiography = sanitBiography.substring(0, 100);
        }
        sanitBiography = validator.whitelist(sanitBiography, helper.userNameWhitelist);
        retUser.biography = sanitBiography;
    }

    if(user.gender){
        let sanitGender = validator.trim(user.gender);
        if(sanitGender.length > 100){
            sanitGender = sanitGender.substring(0, 100);
        }
        sanitGender = validator.whitelist(sanitGender, helper.userNameWhitelist);
        retUser.gender = sanitGender;
    }

    retUser._id = user._id;
    //the email and alias cannot be modified from this panel, so we are sending them right back
    retUser.alias = user.alias;
    retUser.email = user.email;

    return retUser;
}

function sanitizeAlias(alias){
    let sanitAlias = validator.trim(alias);
    if(sanitAlias.length > 50){
        sanitAlias = sanitAlias.substring(0, 50);
    }
    sanitAlias = validator.whitelist(sanitAlias, helper.userNameWhitelist);

    return sanitAlias;
}

function sanitizeEmail(email){
    let sanitEmail = validator.trim(email);
    if(sanitEmail.length > 254){
        sanitEmail = sanitEmail.substring(0, 254);
    }
    return sanitEmail;
}

function sanitizePassword(password){
    let sanitPassword = helper.removeWhiteSpaces(password);
    if(sanitPassword.length > 20){
        sanitPassword = sanitPassword.substring(0, 20);
    }

    //IF the password has been modified, we reset it
    if(sanitPassword != password){
        sanitPassword = '';
    }

    return sanitPassword;
}





