/**
 * Created by Adina Paraschiv on 3/4/2017.
 */

'use strict';
const express = require('express'),
    router = express.Router(),
    keys = require('../static_keys/project_keys'),
    User = require('../models/userModel'),
    passport = require('passport'),
    passportLocal = require('passport-local'),
    bcrypt = require('bcryptjs'),
    authentification = require('../passport/authentification'),
    logger = require('winston');


//Route for registering users
router.post('/' + keys.register, function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.register} for user: ${req.body.user.email}`);

    let errors = validateFields(req, true);

    if (errors){
        res.json({errors: errors})
    } else {
        let user = req.body.user;
        //No validation errors at this point
        User.findOne({email: user.email}, function(err, result){
            if (err){
                res.status(500).json({errors:keys.dbsUserCreationError})
            }
            else if(result){
                //If we already find an entry with this email
                res.json({errors:{email:'Cont existent'}});
                logger.info("An account with this email already exists: " + (req.body.user.email));
            } else {
                //If there are no errors we, save the new user
                user.password2 = undefined;
                let newUser = new User(user);

                User.createUser(newUser, function(err, user){
                    if(err){
                        logger.error('Error saving user in the database:' + err);
                        return res.setStatus(500);
                    } else {
                        logger.debug('User created:', user.email);
                        res.json({success:true});
                    }
                });
            }


        });
    }
});

//Route for logging in users
router.post('/' + keys.login, passport.authenticate('local'), function(req, res){
    logger.debug(`Entering UsersRoute:${keys.login}`);
    res.json({user:req.user});
});


//Route for user to know it is logged in (authenticated)
router.get('/' + keys.amIAuthenticated, authentification.ensureAuthenticated, function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.amIAuthenticated}`);
    res.json({user:req.user});
});

//Route for logging out
router.get('/' + keys.logout, authentification.ensureAuthenticated, function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.logout},  user: ${req.user.email}`);
    req.logout();
    res.json({success:true});
})


//Route for editing user info
router.post('/' + keys.editUser, authentification.ensureAuthenticated, function(req, res){
    logger.debug(`Entering UsersRoute: ${keys.editUser}`);

    let newUser = req.body.user;
    //Email should not be changed
    if (newUser.email !== req.user.email){
        res.json({errors:keys.parentEmailNotMatchError});
        logger.error(`Logged in user email (${req.user.email}) does not match edited user (${newUser.email}) info`);
    } else {
        let errors = validateFields(req, false);
        if (errors){
            res.json(errors);
        } else {
            logger.silly('newUser', JSON.stringify(newUser , undefined, 2));
            User.findOneAndUpdate({'_id':req.user._id}, //The user to update (the currently authenticated user)
                {$set: newUser}, // what to modifie the current user to
                {new: true}, //Return the new, modified user
                function(err, modifiedUser){
                if (err){
                    logger.error(`Error modifying user (${req.user.email}) in the database: ` + err);
                    return res.sendStatus(500);
                } else {
                    res.json({user: modifiedUser});
                }
            });
        }
    }
});

//This is the local strategy password uses to log in a user and save a session
passport.use(new passportLocal.Strategy(
    {   usernameField:"email",
        passwordField:"password"
    },
    function(email, password, done){
        logger.debug('Entering LocalAuthentificationStrategy');
        User.findUserByEmail(email, function (err, user) {
            if (err) {
                //TODO check what done does when mongo server is not running
                logger.error('Error finding user in the database')
                done(err);
            } else {
                if (!user) {
                    logger.debug('User: ' + email + 'does not exist');
                    done(null, false);
                } else {
                    bcrypt.compare(password, user.password, function (err, isMatch) {
                        if (err) {
                            logger.error('Error comparing passwords with bcrypt: ' + err);
                            done(err);
                        } else {
                            if (isMatch) {
                                user.password = undefined;
                                done(null, user);
                            } else {
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
    logger.debug('Serialize user: ', JSON.stringify(user , undefined, 2));
    if (user){
        done(null, {_id:user._id, email:user.email});
    } else {
        done(new Error('No user'));
    }
});

passport.deserializeUser(function(user, done){
    logger.debug('Deserialize user: ', user.email);
    User.findUserById(user._id, function(err, user){
        if (err){
            //TODO check what done(err) propagates
            logger.error(`Error searching for user (${user.email}) in database: ` + err);
            done(err);
        }else {
            if (!user){
                logger.warn(`User (${user.email}) not found in database by deserialize function`);
                done(null, false);
            } else {
                user.password = undefined;
                logger.silly('Deserialized user after delete:', JSON.stringify(user , undefined, 2));
                done(null, user);
            }
        }
    })
});

//Method that validates the field for the register and for the modify user routes
function validateFields(req, forRegister){
    //Validation
    req.checkBody("user.firstName", "Prenumele este necesar").notEmpty();
    req.checkBody("user.lastName", "Numele de familie este necesar").notEmpty();
    req.checkBody("user.email", "Email-ul este necesar").notEmpty();
    req.checkBody("user.email", "Email-ul nu este scris corect").isEmail();
    req.checkBody('user.birthDate', 'Ne pare rau, nu ai varsta potrivita pentru a iti face un cont').isAgeGreaterThen14();
    req.checkBody('user.birthDate', 'Ziua de nastere nu este completa').isDate();
    req.checkBody('user.address', 'Lipseste adresa').notEmpty();
    req.checkBody('user.phone', "Numărul de telefon lipseste sau contine alte caractere").isNumeric();
    req.checkBody('user.phone', "Numărul de telefon lipseste sau contine alte caractere").notEmpty();
    if (forRegister){
        req.checkBody("user.password", "Parola este necesara").notEmpty();
        req.checkBody("user.password2", "Parola incorecta").equals(req.body.user.password);
    }

    return req.validationErrors();
}

module.exports = router;