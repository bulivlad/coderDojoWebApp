/**
 * Created by Adina Paraschiv on 3/4/2017.
 */

'use strict';
const express = require('express');
const router = express.Router();
const keys = require('../static_keys/project_keys');
const userController = require('../controllers/usersController')
const passport = require('passport');
const authentification = require('../passport/authentification');

//Route for registering users
router.post('/' + keys.register, userController.registerUser);

//Route for registering childUsers by parent
router.post('/' + keys.registerChildRoute, authentification.ensureAuthenticated, userController.registerUsersChild);

//Route for logging in users. Here we user passport.authenticate local strategy to authenticate the user
router.post('/' + keys.login, passport.authenticate('local'), userController.loginUser);

//Route for user to know it is logged in (authenticated)
router.get('/' + keys.amIAuthenticatedUserRoute, authentification.ensureAuthenticated, userController.amIAuthenticated);

//Route that returns a user's children
router.get('/' + keys.getChildrenRoute, authentification.ensureAuthenticated, userController.getUsersChildren);

//Route that returns a user's parents
router.get('/' + keys.getUsersParentsRoute, authentification.ensureAuthenticated, userController.getUsersParents);

//Route that gets a user's child's parents
router.post('/' + keys.getChildsParentsRoute, authentification.ensureAuthenticated, userController.getChildsParents);

//Route for logging out
router.get('/' + keys.logout, authentification.ensureAuthenticated, userController.logout)

//Route for editing user info
router.post('/' + keys.editUser, authentification.ensureAuthenticated, userController.editUser);

//Route for editing users child info
router.post('/' + keys.editUsersChild, authentification.ensureAuthenticated, userController.editUsersChild);

//Route for getting user's notification
router.get('/' + keys.getUsersNotificationsRoute, authentification.ensureAuthenticated, userController.getUsersNotifications);

//Route for getting the notifications of a users child
router.post('/' + keys.getUsersChildNotificationsRoute, authentification.ensureAuthenticated,
            userController.getUsersChildsNotifications);

//Route for inviting user to be a parent of another user
router.post('/' + keys.inviteUserToBeParentRoute, authentification.ensureAuthenticated,
            userController.inviteUserToBeParent);

//Route for deleting a single notification for a user
router.post('/' + keys.deleteNotificationForUserRoute, authentification.ensureAuthenticated,
            userController.deleteNotificationForUser);

//Method for deleting a single notification for a users child
router.post('/' + keys.deleteNotificationForUsersChildRoute, authentification.ensureAuthenticated,
            userController.deleteNotificationForUsersChild);

//Method for accepting and invitation from a child to be his/her parent
router.post('/' + keys.acceptChildInviteRoute, authentification.ensureAuthenticated, userController.acceptChildInvite);

//Method for uploading user pictures
router.post('/' + keys.uploadUserPictureRoute, authentification.ensureAuthenticated, userController.uploadUserPicture);

//Method for getting the count of new notifications for a user
router.get('/' + keys.getNewNotificationsCountRoute, authentification.ensureAuthenticated, userController.getNewNotificationsCount);

//Method for getting a users badges
router.post('/' + keys.getUsersBadgesRoute, authentification.ensureAuthenticated, userController.getUsersBadges);

//Method for getting info about changing the user's email or alias
router.post('/' + keys.getChangeUserIdentificationInfoFromServerRoute, authentification.ensureAuthenticated, userController.getChangeUserIdentificationInfo);

//Method for changing a users alias
router.post('/' + keys.changeUserAliasRoute, authentification.ensureAuthenticated, userController.changeUserAlias);

//Method for changing a users email
router.post('/' + keys.changeUserEmailRoute, authentification.ensureAuthenticated, userController.changeUserEmail);

//Method for getting info about changing the user's password
router.post('/' + keys.getChangeUserPasswordsInfoRoute, authentification.ensureAuthenticated, userController.getChangeUserPasswordInfo);

//Method for changing a user's password
router.post('/' + keys.changeUserPasswordRoute, authentification.ensureAuthenticated, userController.changeUserPassword);






module.exports = router;