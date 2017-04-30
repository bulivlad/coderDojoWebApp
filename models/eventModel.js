/**
 * Created by Adina Paraschiv on 4/24/2017.
 */

const mongoose = require('mongoose');
const keys = require('../static_keys/project_keys');
const logger = require('winston');

let eventSchema = mongoose.Schema({
    dojo: {
        type: String,
        index: true,
    },
});