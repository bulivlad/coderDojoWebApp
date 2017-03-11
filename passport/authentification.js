/**
 * Created by Adina Paraschiv on 3/8/2017.
 */

let authentification = {};



authentification.ensureAuthenticated = function (req, res, next){
    console.log('ensure authentificated');
    if(req.isAuthenticated()){
        console.log('is authentificated')
        next();
    } else {
        console.log('is not authentificated')
        res.sendStatus(403);
    }
}

module.exports = authentification;
