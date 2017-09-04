/**
 * Created by Adina Paraschiv on 3/4/2017.
 */

'use strict';
const mongoose = require('mongoose'),
    bcrypt = require('bcryptjs'),
    keys = require('../static_keys/project_keys'),
    logger = require('winston');

let notificationSchema = mongoose.Schema({
        notifications: [{
            typeOfNot: String,
            data: mongoose.Schema.Types.Mixed
        }],
        newNotificationCount: Number,
        dateNotificationsRead: Date
    }
);

let badgesSchema = mongoose.Schema({
    typeOfBadge: {type: mongoose.Schema.Types.ObjectId, ref: 'Badge'},
    received: [{
        dateReceived: {
            type: Date
        },
        receivedFromDojo: {
            type: mongoose.Schema.Types.ObjectId, ref: 'Dojo'
        }
    }]
});

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
    badges:[badgesSchema],
    notifications: notificationSchema,
    userPhoto: {
        type: String
    }
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

module.exports.findUserByIdForDeserialization = function(id, callback){
    User.findById(id, deserializedFields, callback);
};

//These are the fields we get from the database when we deserialieze the user on communication
let deserializedFields = {
    address: true,
    biography: true,
    birthDate: true,
    children: true,
    email: true,
    facebook: true,
    firstName: true,
    gender: true,
    languagesSpoken: true,
    lastName: true,
    linkedin: true,
    parents: true,
    phone: true,
    programmingLanguages: true,
    alias: true,
    authorizationLevel:true,
    userPhoto: true
};

module.exports.getUsersForMember = function(userIds, callback){
    User.find({_id: {$in: userIds}}, fieldsToGetForUsersForMember, callback);
};

let fieldsToGetForUsersForMember = {
    firstName: true,
    lastName: true,
    email:true,
    alias: true
};

//Method for adding a notification for a user
module.exports.addNotificationForUser = function(userId, notification, callback){
    logger.silly(`enter addNotification, notification =${JSON.stringify(notification)}`);
    User.findOneAndUpdate({_id: userId},
        {$push: {'notifications.notifications': notification}, $inc: {'notifications.newNotificationCount':1}}, callback);
};

//Method for adding a notifications for a user
module.exports.addNotificationsForUser = function(userId, notifications, callback){
    User.findOneAndUpdate({_id: userId},
        {$push: {'notifications.notifications': {$each:notifications}},
         $inc: {'notifications.newNotificationCount':notifications.length}}, callback);
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
    birthDate: true,
    userPhoto: true
};

//Method for updating a users photo
module.exports.updatePhotoForUser = function(userId, userPhotoName, callback){
    User.findOneAndUpdate({_id: userId}, {$set :{userPhoto: userPhotoName}}, {upsert:false}, callback);
};

let fieldsToGetForUsersNames = {firstName: true, lastName: true};
//Method for getting user's names
module.exports.getUsersNames = function(usersIds, usersThatAreMinors, callback){
    let query = {_id: {$in: usersIds}};
    if(usersThatAreMinors){
        let date18YearsAgo = new Date();
        date18YearsAgo.setFullYear(date18YearsAgo.getFullYear() - 18);
        query = {_id: {$in: usersIds}, birthDate:{$gt: date18YearsAgo}}
    }
    User.find(query, fieldsToGetForUsersNames, callback);
};

let fieldsToGetUForsersBirthdate = {_id: true};
//Method for getting user's names
module.exports.getUsersBirthdate = function(usersIds, usersThatAreMinors, callback){
    let query = {_id: {$in: usersIds}};
    if(usersThatAreMinors){
        let date18YearsAgo = new Date();
        date18YearsAgo.setFullYear(date18YearsAgo.getFullYear() - 18);
        query = {_id: {$in: usersIds}, birthDate:{$gt: date18YearsAgo}}
    }
    User.find(query, fieldsToGetUForsersBirthdate, callback);
};

let fieldsToGetForGettingUsersAndHisChildren = {children:true, email:true, alias:true, authorizationLevel: true};
//Method for getting user's children for adding them to a dojo when a user has been accepted to
module.exports.getUsersAndHisChildren = function(userId, callback){
    User.findOne({_id:userId}, fieldsToGetForGettingUsersAndHisChildren, callback);
};

module.exports.getUserNotifications = function(userId, callback){
    User.findOne({_id:userId}, {notifications:true}, callback);
};

module.exports.getUserNotificationsAndResetNewNotifications = function(userId, callback){
    User.findOneAndUpdate({_id:userId},
        {$set: {'notifications.newNotificationCount': 0, 'notifications.dateNotificationsRead': Date.now()}},{notifications:true}, callback);
};

module.exports.deleteNotificationForUser = function(userId, notificationId, callback){
    User.findOneAndUpdate({_id: userId}, {$pull: {'notifications.notifications': {_id: notificationId}}}, callback);
};

module.exports.getBadgesOfUser = function(userId, callback){
  User.findOne({_id: userId}, {badges: true})
      .populate('badges.typeOfBadge')
      .populate('badges.received.receivedFromDojo', {name: true})
      .exec(callback);
};

module.exports.setBadgesOfUser = function(userId, modifiedBadges, callback){
    if(modifiedBadges){
        User.findOneAndUpdate({_id: userId}, {$set: {badges: modifiedBadges}}, callback);
    } else {
        callback(Error('Badges are empty'));
    }

};

module.exports.searchForUserByEmail = function(email, callback){
    User.findOne({email: email}, {email:true}, callback);
};

module.exports.updateUser = function(user, fieldsToUpdate, callback){
    User.findOneAndUpdate({_id: user._id}, {$set: fieldsToUpdate}, callback);
};

module.exports.getChangeUserIdentificationInfo = function(userId, callback){
    User.findOne({_id:userId}, {alias:true, email:true, birthDate: true}, callback);
};

module.exports.checkIfAliasExists = function(alias, callback){
    User.findOne({alias: alias}, {_id:true}, callback);
};

module.exports.changeUsersAlias = function(newAlias, userId, callback){
    User.findOneAndUpdate({_id:userId}, {$set: {alias: newAlias}}, callback);
};

module.exports.checkIfEmailExists = function(email, callback){
    User.findOne({email: email}, {_id:true}, callback);
};

module.exports.changeUsersEmail = function(newEmail, userId, callback){
    User.findOneAndUpdate({_id:userId}, {$set: {email: newEmail}}, callback);
};

module.exports.getChangeUserPasswordInfo = function(userId, callback){
    User.findOne({_id:userId}, {password:true, birthDate: true}, callback);
};

module.exports.changeUsersPassword = function(newPasswordHash, userId, callback){
    User.findOneAndUpdate({_id:userId}, {$set: {password: newPasswordHash}}, callback);
};