/**
 * Created by catap_000 on 5/21/2017.
 */


'use strict';
const express = require('express');
const router = express.Router();
const keys = require('../static_keys/project_keys');
const eventController = require('../controllers/eventController')
const authentification = require('../passport/authentification');

//Route for getting events for a dojo for unauthenticated users
router.post('/' + keys.getCurrentDojoEventsRoute, eventController.getCurrentDojoEvents);

//Route for getting events for a dojo for unauthenticated users
router.post('/' + keys.getCurrentDojoEventsRoute, authentification.ensureAuthenticated, eventController.getAuthCurrentDojoEvents);

module.exports = router;