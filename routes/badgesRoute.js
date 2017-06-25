/**
 * Created by catap_000 on 6/19/2017.
 */


'use strict';
const express = require('express');
const router = express.Router();
const keys = require('../static_keys/project_keys');
const badgesController = require('../controllers/badgesController');
const authentification = require('../passport/authentification');

//Route for adding a new badge (only the admin can do that)
router.post('/' + keys.addBadgeRoute, authentification.ensureAuthenticated, badgesController.addBadge);

//Route for editing an existing badge  (only the admin can do that)
router.post('/' + keys.editBadgeRoute, authentification.ensureAuthenticated, badgesController.editBadge);

//Route getting all badges for UNauthenticated badges
router.get('/' + keys.getAllBadgesRoute, badgesController.getAllBadges);

//Route getting all badges for Authenticated badges
router.get('/' + keys.getAuthAllBadgesRoute, authentification.ensureAuthenticated, badgesController.getAuthAllBadges);

//Method for uploading a badges picture
router.post('/' + keys.uploadBadgePictureRoute, authentification.ensureAuthenticated, badgesController.uploadBadgePicture);

module.exports = router;