/**
 * Created by Adina Paraschiv on 2/26/2017.
 */

'use strict';
const express = require('express'),
    router = express.Router(),
    keys = require('../static_keys/project_keys'),
    templating = require("../templating/info"),
    authentification = require('../passport/authentification');

router.get('/' + keys.despre, authentification.ensureAuthenticated, function(req, res){
    res.json({info:'This is authorized communication.'});

});

module.exports = router;
