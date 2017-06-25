/**
 * Created by catap_000 on 6/19/2017.
 */


const mongoose = require('mongoose');
const keys = require('../static_keys/project_keys');
const logger = require('winston');

let BadgeSchema = mongoose.Schema({
    name: {
        type: String,
        unique: true
    },
    points: {
        type: Number
    },
    description: {
        type: String
    },
    badgePhoto: {
        type: String
    }
});

let Badge = mongoose.model('Badge', BadgeSchema);

module.exports.addBadge = function(badge, callback){
    let badgeToSave = new Badge(badge);
    badgeToSave.save(callback);
};

module.exports.editBadge = function(badge, callback){
    Badge.findOneAndUpdate({_id:badge._id},
        {$set: {name: badge.name, points: badge.points, description: badge.description}}, callback);
};

module.exports.getAllBadges = function(callback){
  Badge.find({}, callback);
};

module.exports.updateBadgePhoto = function(badgeId, filename, callback){
    Badge.findOneAndUpdate({_id: badgeId}, {$set: {badgePhoto: filename}}, callback);
};