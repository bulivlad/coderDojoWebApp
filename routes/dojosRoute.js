/**
 * Created by Adina Paraschiv on 3/4/2017.
 */

'use strict';
const express = require('express');
const router = express.Router();
const keys = require('../static_keys/project_keys');
const dojosController = require('../controllers/dojosController')
const authentification = require('../passport/authentification');


//Route for adding a new dojo (only the admin can do that)
router.post('/' + keys.addDojoRoute, authentification.ensureAuthenticated, dojosController.addDojo);

//Route for getting the existing dojos
router.get('/' + keys.getDojos, dojosController.getDojos);

//Method that returns the upcoming dojos for unauthorized users
router.get('/' + keys.getAuthDojos, authentification.ensureAuthenticated, dojosController.getAuthenticatedDojos);

//Method that returns the a user's dojos
router.get('/' + keys.getMyDojos, authentification.ensureAuthenticated, dojosController.getMyDojos);

//Method for becoming member of dojo
router.post('/' + keys.becomeMemberOfDojoRoute, authentification.ensureAuthenticated, dojosController.becomeMemberOfDojo);

//Method for leaving dojo (being a membe or a pending member)
router.post('/' + keys.leaveDojoRoute, authentification.ensureAuthenticated, dojosController.leaveDojo);

//Method for getting the users that are a part of a dojo (summary info)
router.post('/' + keys.getUsersForMember, authentification.ensureAuthenticated, dojosController.getUsersForMember);

//Method for getting a user that is part of a dojo (full info)
router.post('/' + keys.getDetailedUserForMemberRoute, authentification.ensureAuthenticated, dojosController.getDetailedUserForMember);

//Method for rejecting a users application to become a member for a dojo
router.post('/' + keys.rejectPendingMemberRoute, authentification.ensureAuthenticated, dojosController.rejectPendingMember);

//Method for accepting a users application to become a member for a dojo
router.post('/' + keys.acceptPendingMemberRoute, authentification.ensureAuthenticated, dojosController.acceptPendingMember);






module.exports = router;