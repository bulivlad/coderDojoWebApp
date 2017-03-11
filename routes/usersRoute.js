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
    authentification = require('../passport/authentification');;

router.post('/' + keys.register, function(req, res){
    console.log("LOGGING: registering user " + JSON.stringify(req.body.user));

    let firstName = req.body.user.firstName;
    let lastName = req.body.user.lastName;
    let email = req.body.user.email;
    let password = req.body.user.password;
    let birthdate = req.body.user.birthdate;

    //Validation
    req.checkBody("user.firstName", "Prenumele este necesar").notEmpty();
    req.checkBody("user.lastName", "Numele de familie este necesar").notEmpty();
    req.checkBody("user.email", "Email-ul este necesar").notEmpty();
    req.checkBody("user.email", "Email-ul nu este scris corect").isEmail();
    req.checkBody('user.birthdate', 'Ziua de nastere nu este completa').isDate();
    req.checkBody("user.password", "Parola este necesara").notEmpty();
    req.checkBody("user.password2", "Parola incorecta").equals(password);

    let errors = req.validationErrors();

    if (errors){
        res.json({errors: errors})
    } else {
        //No validation errors at this point
        User.findOne({email: email}, function(err, result){
            if (err){
                res.json({errors:keys.dbsUserCreationError})
            }
            else if(result){
                //If we already find an entry with this email
                res.json({errors:{email:'Cont existent'}});
            } else {
                //If there are no errors we, sa ve the new user
                let newUser = new User({
                    email:email,
                    password: password,
                    firstName: firstName,
                    lastName: lastName,
                    birthdate: birthdate
                });

                User.createUser(newUser, function(err, user){
                    if(err){
                        res.json({errors:keys.dbsUserCreationError});
                        console.log('LOGGING: error:' + keys.dbsUserCreationError + '\n' + err);
                    } else {
                        console.log('LOGGING User created:', JSON.stringify(user));
                        res.json({success:true});
                    }
                });
            }


        });
    }
});

router.post('/' + keys.login, passport.authenticate('local'), function(req, res){
    console.log('LOGGING: entering UsersRoute:Login');
    let answer = {
        user: {
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            authorizationLevel: req.user.authorizationLevel
        }
    };
    res.json(answer);
});

router.get('/' + keys.amIAuthenticated, authentification.ensureAuthenticated, function(req, res){
    res.json({user:req.user});
});



passport.use(new passportLocal.Strategy(
    {   usernameField:"email",
        passwordField:"password"
    },
    function(email, password, done){
        console.log('LOGGING: entering LocalAuthentificationStrategy');

        User.findUserByEmail(email, function (err, user) {
            if (err) {
                done(err);
            } else {
                if (!user) {
                    done(null, false);
                } else {
                    bcrypt.compare(password, user.password, function (err, isMatch) {
                        if (err) {
                            console.log('LOGGING: error comparing strings');
                            done(err);
                        } else {
                            if (isMatch) {
                                done(null, user);
                            } else {
                                console.log('LOGGING: password does not match');
                                done(null, false);
                            }
                        }
                    })
                }
            }
        });
    }));


passport.serializeUser(function(user, done){
    console.log('Logging: serialize user: ', JSON.stringify(user));
    done(null, {_id:user._id, email:user.email});
});

passport.deserializeUser(function(user, done){
    console.log('Logging: deserialize user: ', user.email);
    User.findUserById(user._id, function(err, user){
        if (err){
            console.log("Error searching for user in deserializeUser function: " + err);
            done(err);
        }else {
            if (!user){
                console.log('LOGGING: user not found by deserialize function!!');
                done(null, false);
            } else {
                done(null, user);
            }
        }
    })
});

module.exports = router;