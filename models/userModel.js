/**
 * Created by Adina Paraschiv on 3/4/2017.
 */

'use strict';
const mongoose = require('mongoose'),
      bcrypt = require('bcryptjs'),
      keys = require('../static_keys/project_keys');

let UserSchema = mongoose.Schema({
    email: {
        type: String,
        index: true
    },
    password: {
        type: String
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    birthdate: {
        type: Date
    },
    creationDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    authorizationLevel: {
        type: String,
        required: true,
        default: keys.user
    }
});

// Here we export the DataBase interface to our other modules
let User = module.exports = mongoose.model("User", UserSchema);

module.exports.createUser = function(newUser, callback){
    console.log('LOGGING: creating user');
    bcrypt.genSalt(10, function(err, salt){
        if (err){
            console.log('LOGGING: error obtaining salt');
            callback(new Error());
        }
        bcrypt.hash(newUser.password, salt, function(err, hash){
            newUser.password = hash;
            newUser.save(callback);
        });
    });
}

module.exports.findUserByEmail = function(email, callback){
    let query = {email: email};
    try {
        User.findOne(query, callback);
    }
    catch (error){
        console.log('error communicating with database');
    }
}

module.exports.findUserById = function(id, callback){
    User.findById(id, callback);
}

