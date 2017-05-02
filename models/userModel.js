/**
 * Created by Adina Paraschiv on 3/4/2017.
 */

'use strict';
const mongoose = require('mongoose'),
      bcrypt = require('bcryptjs'),
      keys = require('../static_keys/project_keys'),
      logger = require('winston');

let UserSchema = mongoose.Schema({
    email: {
        type: String,
        index: true,
        unique: true
    },
    password: {
        type: String,
        select: false
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    alias: {
        type: String,
        index: true,
        unique: true
    },
    birthDate: {
        type: Date,
        required: true
    },
    creationDate: {
        type: Date,
        default: Date.now,
        required: true,
        select:false
    },
    authorizationLevel: {
        type: String,
        required: true,
        default: keys.user
    },
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    facebook: {
        type: String
    },
    linkedin: {
        type: String
    },
    languagesSpoken: {
        type: String
    },
    programmingLanguages: {
        type: String
    },
    biography: {
        type: String
    },
    gender: {
      type: String
    },
    children: {
        type: Array
    },
    parents: {
        type: Array
    },
    badges: {
        type:Array,
        select:false
    },
    notifications: [
        {
            typeOfNot: String,
            data: mongoose.Schema.Types.Mixed //TODO make notifications not selectable by default
        }
    ]
});

// Here we export the DataBase interface to our other modules
let User = module.exports = mongoose.model("User", UserSchema);

//Method for saving a new user to the database
module.exports.createUser = function(newUser, callback){
    logger.debug('Creating user ' + JSON.stringify(newUser, undefined, 2));
    if(newUser.password){
        //If the user is saved with a password, we need to hash it, and save the user with the hash
        bcrypt.genSalt(10, function(err, salt){
            if (err){
                logger.error('Error obtaining salt: ' + err);
                callback(err);
            }
            bcrypt.hash(newUser.password, salt, function(err, hash){
                newUser.password = hash;
                newUser.save(callback);
            });
        });
    } else {
        newUser.save(callback);
    }
};

module.exports.findUserByEmailOrAlias = function(emailOrAlias, callback){
    let query = {email: emailOrAlias};
    if(!emailOrAlias.match(/@/g)){//If the entry does not have an "@" it is an alias
        query = {alias: emailOrAlias};
    }
    User.findOne(query, {password: true},  callback);
};

module.exports.findUserByIdForDeserialization = function(id, fieldsToGet, callback){
    User.findById(id, fieldsToGet, callback);
};


module.exports.getUsersForMember = function(userIds, callback){
    User.find({_id: {$in: userIds}}, fieldsToGetForUsersForMember, callback);
};

let fieldsToGetForUsersForMember = {
    firstName: true,
    lastName: true
};

//Method for adding a notification for a user
module.exports.addNotificationForUser = function(userId, notification, callback){
    logger.silly(`enter addNotification, notification =${JSON.stringify(notification)}`);
    User.findOneAndUpdate({_id: userId}, {$addToSet: {notifications: notification}}, function(err, user){
        callback(err, user);
    });
};


module.exports.getDetailedUserForMember = function(userId, callback){
    console.log('getDetailedUserForMember called');
    User.findOne({_id:userId}, fieldsToGetUserForMember,  callback);
};

let fieldsToGetUserForMember = {
    firstName: true,
    lastName: true,
    phone:true,
    address: true,
    email: true,
    alias: true,
    facebook: true,
    linkedin: true,
    languagesSpoken: true,
    programmingLanguages: true,
    biography: true,
    gender: true,
    birthDate: true
};

