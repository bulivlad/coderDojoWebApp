/**
 * Created by catap_000 on 5/21/2017.
 */

const keys = require('../static_keys/project_keys');

module.exports.isActive = function(eventOrSession){
    if(eventOrSession.activeStatus === keys.eventStatus[0]){ //If the event is active
        return true;
    } else {
        return false;
    }
};

//Method for displaying user information for logging
module.exports.getUser = function(req){
        if(req.user){
            return `user=(email=${req.user.email}, alias=${req.user.alias}, _id=${req.user._id}, authorizationLevel=${req.user.authorizationLevel})`;
        }
    }
