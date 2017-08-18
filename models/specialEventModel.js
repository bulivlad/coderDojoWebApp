/**
 * Created by catap_000 on 7/6/2017.
 */

const mongoose = require('mongoose');
const keys = require('../static_keys/project_keys');
const logger = require('winston');


let specialEventSchema = new mongoose.Schema({
    name: {type: String, required: true},
    description: {type: String, required: true},
    address: {type: String, required: true},
    latitude: {type: Number, required: true},
    longitude: {type: Number, required: true},
    city: {type: String, required: true, enum: keys.cities},
    startTime: {type: Date, required: true},
    endTime: {type: Date, required: true},
    photo: {type: String}
});

let SpecialEvent = mongoose.model("SpecialEvent", specialEventSchema);

module.exports.addSpecialEvent = function(specialEvent, callback){
    let specialEventToSave = new SpecialEvent(specialEvent);
    specialEventToSave.save(callback);
};

module.exports.editSpecialEvent = function(editedSpecialEvent, callback){
  SpecialEvent.findOneAndUpdate({_id: editedSpecialEvent._id},
      {$set:
         {
             name: editedSpecialEvent.name,
             description: editedSpecialEvent.description,
             address: editedSpecialEvent.address,
             latitude: editedSpecialEvent.latitude,
             longitude: editedSpecialEvent.longitude,
             city: editedSpecialEvent.city,
             startTime: editedSpecialEvent.startTime,
             endTime: editedSpecialEvent.endTime
         }
      }, callback);
};

module.exports.getCurrentSpecialEvents = function(callback){
    SpecialEvent.find({endTime: {$gt: Date.now()}}, callback);
};

module.exports.getSpecialEvent = function(specialEventId, callback){
    SpecialEvent.findOne({_id: specialEventId}, callback);
};

module.exports.updateSpecialEventPhoto = function(specialEventId, filename, callback){
    SpecialEvent.findOneAndUpdate({_id: specialEventId}, {$set: {photo: filename}}, callback);
};