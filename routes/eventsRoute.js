/**
 * Created by catap_000 on 5/21/2017.
 */


'use strict';
const express = require('express');
const router = express.Router();
const keys = require('../static_keys/project_keys');
const eventController = require('../controllers/eventController');
const authentification = require('../passport/authentification');

//Route for getting events for a dojo for unauthenticated users
router.post('/' + keys.getCurrentDojoEventsRoute, eventController.getCurrentDojoEvents);

//Route for getting events for a dojo for unauthenticated users
router.post('/' + keys.getAuthCurrentDojoEventsRoute, authentification.ensureAuthenticated, eventController.getAuthCurrentDojoEvents);

//Route for getting events the user (or his/her children) are registered for
router.get('/' + keys.getMyEventsRoute, authentification.ensureAuthenticated, eventController.getMyEvents);

//Route for getting current events for authenticated users
router.get('/' + keys.getCurrentAuthEventsRoute, authentification.ensureAuthenticated, eventController.getCurrentAuthEvents);

//Route for getting current events for unauthenticated users
router.get('/' + keys.getCurrentEventsRoute,  eventController.getCurrentEvents);

//method for getting an event for unauthenticated users
router.post('/' + keys.getEventRoute, eventController.getEvent);

//method for getting an event for authenticated users
router.post('/' + keys.getAuthEventRoute, authentification.ensureAuthenticated, eventController.getAuthEvent);

//Method for registering a user for an event
router.post('/' + keys.registerUserForEventRoute, authentification.ensureAuthenticated, eventController.registerUserForEvent);

//Method for canceling a user's registration for an event
router.post('/' + keys.removeUserFromEventRoute, authentification.ensureAuthenticated,
                eventController.removeUserFromEventEvent);

//Method for registering a user for an event
router.post('/' + keys.getUsersRegisteredForEventRoute, authentification.ensureAuthenticated,
                eventController.getUsersRegisteredForEvent);

//Method for confirming a users registration for an event, or removing him/her from the event
router.post('/' + keys.confirmOrRemoveUserFromEventRoute, authentification.ensureAuthenticated,
    eventController.confirmOrRemoveUserFromEvent);

//Method for deleting an event
router.post('/' + keys.deleteEventRoute, authentification.ensureAuthenticated, eventController.deleteEvent);

//Method for gettng event for editing
router.post('/' + keys.getEventForEditingRoute, authentification.ensureAuthenticated, eventController.getEventForEditing);

//Method for editing an existing unique event
router.post('/' + keys.editEventOfDojoRoute, authentification.ensureAuthenticated, eventController.editEvent);

//Method for getting users already invited for a particular event
router.post('/' + keys.getUsersInvitedToEventRoute, authentification.ensureAuthenticated, eventController.getUsersInvitedToEvent);

//Method for getting users already invited for a particular event
router.post('/' + keys.sendUserInvitesToEventRoute, authentification.ensureAuthenticated, eventController.sendUserInvitesToEvent);

//Method for adding special events
router.post('/' + keys.addSpecialEventRoute, authentification.ensureAuthenticated, eventController.addSpecialEvent);

//Method for editing special events
router.post('/' + keys.editSpecialEventRoute, authentification.ensureAuthenticated, eventController.editSpecialEvent);

//Method for getting current special events
router.get('/' + keys.getCurrentSpecialEventsRoute, eventController.getCurrentSpecialEvents);

//Method for getting special event
router.post('/' + keys.getSpecialEventRoute, eventController.getSpecialEvent);

//Method for uploading special event photo
router.post('/' + keys.uploadSpecialEventPictureRoute, authentification.ensureAuthenticated, eventController.uploadSpecialEventPhoto);



module.exports = router;