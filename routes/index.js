/**
 * Created by Adina Paraschiv on 2/26/2017.
 */

'use strict';
const express = require('express'),
    router = express.Router(),
    keys = require('../static_keys/project_keys'),
    templating = require("../templating/info");

router.get('/' + keys.despre, function(req, res){
    console.log("rendering " + keys.despre);
    res.json(templating.cache[keys.despre]);

});

module.exports = router;
