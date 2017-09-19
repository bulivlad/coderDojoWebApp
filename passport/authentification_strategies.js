/**
 * Created by catap_000 on 8/21/2017.
 */

const User = require('../models/userModel');
const passportLocal = require('passport-local');
const bcrypt = require('bcryptjs');
const logger = require('winston');
const passport = require('passport');

let initializeStrategies = function(){
    //This is the local strategy password uses to log in a user and save a session
    passport.use(new passportLocal.Strategy(
        {   usernameField:"email",
            passwordField:"password"
        },
        function(email, password, done){
            logger.debug('Entering LocalAuthentificationStrategy');
            //First we search the database for a user with the given email (or alias)
            User.findUserByEmailOrAlias(email, function (err, user) {
                if (err) {
                    logger.error('Error finding user in the database');
                    done(err);
                } else {
                    if (!user) {
                        //If no user is found, we call done with false
                        logger.debug('User: ' + email + 'does not exist');
                        done(null, false);
                    } else {
                        //If the user was found we compare the password given by the user to the hash stored in the database
                        //for this we need to has the passport given, and then compare the hashes
                        bcrypt.compare(password, user.password, function (err, isMatch) {
                            if (err) {
                                logger.error('Error comparing passwords with bcrypt: ' + err);
                                done(err);
                            } else {
                                //If the passwords match we report success
                                if (isMatch) {
                                    user.password = undefined;
                                    done(null, user);
                                } else {
                                    //If the passwords do not match, we call done with false
                                    logger.debug('Password does not match user password');
                                    done(null, false);
                                }
                            }
                        })
                    }
                }
            });
        }));

    passport.serializeUser(function(user, done){
        //logger.silly('Serialize user: ', JSON.stringify(user));
        if (user){
            done(null, {_id:user._id, email:user.email});
        } else {
            logger.error(`No user found for serialization`);
            done(Error('No user'));
        }
    });

    passport.deserializeUser(function(user, done){
        User.findUserByIdForDeserialization(user._id, function(err, user){
            if (err){
                logger.error(`Error searching for user (${user.email}) in database: ` + err);
                done(err);
            }else {
                if (!user){
                    logger.warn(`User (${user.email}) not found in database by deserialize function`);
                    done(null, false);
                } else {
                    //logger.silly('Deserialized user after delete:', JSON.stringify(user));
                    done(null, user);
                }
            }
        })
    });
};

module.exports = initializeStrategies;


