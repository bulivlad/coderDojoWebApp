/**
 * Created by Adina Paraschiv on 3/8/2017.
 */

const logger = require('winston');

let authentification = {};

authentification.ensureAuthenticated = function (req, res, next){
    if(req.isAuthenticated()){
        logger.debug(`User  +  ${req.user.email} +  is authentificated`)
        next();
    } else {
        logger.debug(`User is NOT authentificated`);
        res.sendStatus(401);
    }
}

module.exports = authentification;
