/**
 * Created by Adina Paraschiv on 3/4/2017.
 */

'use strict';
const express = require('express'),
    router = express.Router(),
    keys = require('../static_keys/project_keys'),
    Dojo = require('../models/dojoModel'),
    User = require('../models/userModel'),
    authentification = require('../passport/authentification'),
    logger = require('winston');

//Method that returns the upcoming dojos for unauthorized users
router.get('/' + keys.getDojos, function(req, res){
    logger.debug("Entering DojosRoute: " + keys.getDojos);
    Dojo.getDojos(function(err, dojos){
        if (err){
            logger.error('Problems retrieving dojos from database: ' + err);
            return res.sendStatus(500);
        } else if (!dojos){
            logger.error('Null dojos array: ' + err);
            return res.sendStatus(500);
        } else {
            dojos = prepareDojosListForClient(dojos);
            res.json(dojos);
        }
    });
});

//Method that returns the upcoming dojos for unauthorized users
router.get('/' + keys.getAuthDojos, authentification.ensureAuthenticated, function(req, res){
    logger.debug("Entering DojosRoute: " + keys.getAuthDojos);
    Dojo.getDojos(function(err, dojos){
        if (err){
            logger.error('Problems retrieving dojos from database: ' + err);
            return res.sendStatus(500);
        } else if (!dojos){
            //TODO test this scenario out further
            logger.error('Null dojos array: ' + err);
            return res.sendStatus(500);
        } else {
            let authenticatedUserEmail = req.user.email;
            //If the currentUser is registered/has to a dojo, we add the users child / user to the dojo in a different field(registered)
            dojos = addUsersRegisteredChildren(dojos, authenticatedUserEmail);
            logger.silly('Dojos after map: ', JSON.stringify(dojos));

            dojos = prepareDojosListForClient(dojos);
            res.json(dojos);
        }
    });
});

//Method that returns the upcoming dojos for unauthorized users where they are registered to attend
router.get('/' + keys.getMyDojos, authentification.ensureAuthenticated, function(req, res){
    logger.debug('Entering DojosRoute: ' + keys.getMyDojos);
    Dojo.getDojos(function(err, dojos){
        if (err){
            logger.error('Problems retrieving dojos from database: ' + err);
            return res.sendStatus(500);
        } else if (!dojos){
            logger.error('Null dojos array: ' + err);
            return res.sendStatus(500);
        } else {
            let authenticatedUserEmail = req.user.email;
            //If the currentUser is registered/has to a dojo, we add the users child / user to the dojo in a different field(registered)
            dojos = addUsersRegisteredChildren(dojos, authenticatedUserEmail);


            //Filtering the upcoming dojos array to only the dojos where the user is registered to attend
            dojos = dojos.filter(function(dojo){
                let children = dojo.children;
                //return isUserRegisteredForDojo(authenticatedUserEmail, children);
                //Only add the dojo if the user has children registered for it
                return dojo.registered;
            });
            logger.silly('Dojos after filter: ', JSON.stringify(dojos));
            dojos = prepareDojosListForClient(dojos);
            res.json(dojos);
        }
    });
});

//Method for registering child/user for dojo
router.post('/' + keys.registerChildForDojo, authentification.ensureAuthenticated, function(req, res){
    logger.debug('ENTERING DojosRoute: ' + keys.registerChildForDojo)
    let dojoId = req.body.dojoId;
    let childName = req.body.childName;
    let parent = req.user.email;
    let childObject = {parentEmail: parent, childName: childName};

    Dojo.findOne({_id:dojoId}, function(err, dojo){
        if (err){
            logger.error("Problems searching for dojo: " + err)
            return res.sendStatus(500);
        } else if (!dojo){
            logger.error("Dojo not found: " + err)
            res.json({errors:keys.dojoNotFoundError});
        } else {
            //Dojo found in database
            let children = dojo.children;
            logger.silly('The children: ' + JSON.stringify(children , undefined, 2));
            let numberOfRegisteredChildren = children.length;
            //Determining if there is room in the dojo
            if (numberOfRegisteredChildren <= dojo.maxNumberOfChildren){
                //If the child is not already registered
                if (!isChildAlreadyRegistered(childObject, children)){
                    children.push(childObject);
                    Dojo.findOneAndUpdate({_id:dojoId}, {$set: {children: children}}, {new:true}, function(err, dojo){
                        if (err){
                            logger.error("Problems updating dojo with child: " + JSON.stringify(childObject, undefined, 2) +
                                ", err: " + err);
                            return res.sendStatus(500);
                        } else {
                            logger.silly('Child: ' + JSON.stringify(childObject, undefined, 2) + ' added to dojo: ' +
                                JSON.stringify(dojo, undefined, 2));
                            res.json({dojo:dojo});
                        }
                    });
                } else {
                    logger.warn('Child already registered!');
                    res.json({errors: keys.childAlreadyRegisteredError});
                }
            } else {
                logger.warn('No more room in dojo');
                res.json({errors:keys.noMoreRoomInDojoError})
            }
        }
    })
});

//Method that cancels a childs registry for a dojo
router.post('/' + keys.cancelChildRegistryForDojo, authentification.ensureAuthenticated, function(req, res){
    logger.debug('ENTERING DojosRoute: ' + keys.cancelChildRegistryForDojo);
    let dojoId = req.body.dojoId;
    let childName = req.body.child.childName;
    logger.debug('Removing child: ' + childName);
    let child = req.body.child;
    if(child.parentEmail !== req.user.email){
        //This is a fail safe in case the logged in user email (username) does not match the child's parent
        logger.warn('Parent not not same as logged-in user.')
        res.json({errors: keys.parentEmailNotMatchError});
    } else {
        Dojo.findOne({_id:dojoId}, function(err, dojo){
            if (err){
                logger.error("Problems searching for dojo: " + err)
                return res.sendStatus(500);
            } else if (!dojo){
                logger.error("Dojo not found: " + err)
                res.json({errors:keys.dojoNotFoundError});
            } else {
                //Dojo found in database
                let children = dojo.children;
                logger.silly('The children: ' + JSON.stringify(children , undefined, 2));
                logger.debug(`Children length before removal: l=${children ? children.length: 'null'}`);
                children = removeChildFromRegisteredChildren(children, child);
                logger.debug(`Children length after removal: l=${children ? children.length: 'null'}`);

                Dojo.findByIdAndUpdate(dojoId, {$set: {children: children}}, {new:true}, function(err, dojo){
                    if (err){
                        logger.error("Problems updating dojo with child: " + JSON.stringify(childObject , undefined, 2) + ", err: " + err);
                        return res.sendStatus(500);
                    } else {
                        res.json({dojo:dojo});
                    }
                });
            }
        })
    }


});

//Method that removes a child from the array based on it's id from the database
function removeChildFromRegisteredChildren(children, childToRemove){
    let ret = []
    if (children){
        children.forEach(function(child){
           logger.silly(`childFromArray: ${JSON.stringify(child , undefined, 2)}`);
            logger.silly(`childToRemove: ${JSON.stringify(childToRemove , undefined, 2)}`);
            //We need a weak comparison because the values are of different types
            if( (childToRemove._id != child._id) ||
             // The names comparison is a fail safe in case the id's are lost
                (child.parentName !== childToRemove.parentName || child.childName !== childToRemove.childName) ){
                ret.push(child);
            }
        });
    }
    return ret;
}


//The childParent argument is an object structured {parent: parentEmail, child: childName}
function isChildAlreadyRegistered(testChild, children){
    for(let i = 0; i < children.length; i++){
        let child = children[i];
        if (child.parentEmail === testChild.parentEmail && child.childName === testChild.childName){
            return true;
        }
    }
   return false;
}

//Method for verifying if a user is registered/has children registered to a dojo
function isUserRegisteredForDojo(parentEmail, children){
    for(let i = 0; i < children.length; i++){
        let child = children[i];
        if (child.parentEmail === parentEmail){
            return true;
        }
    }
    return false;
}


function prepareDojosListForClient(dojos){
     var preparedDojos =  dojos.map(function(dojo){
            //Removing unintended information from the user, and determining if there is room in the dojo
            let newDojo = JSON.parse(JSON.stringify(dojo));//We need to clone the object otherwise we could not add new fields
            let children = newDojo.children;
            newDojo.children = undefined;
            let maxNumberOfChildren = newDojo.maxNumberOfChildren;
            newDojo.maxNumberOfChildren = undefined;
            if (children.length >=  maxNumberOfChildren){
                newDojo.isFull = true;
            } else {
                newDojo.isFull = false;
            }
            return newDojo;
    });
    return preparedDojos;

}

function addUsersRegisteredChildren(dojos, authenticatedUserEmail){
    return dojos.map(function(dojo){
        logger.silly('Entering: addUsersRegisteredChildren');
        let newDojo = JSON.parse(JSON.stringify(dojo));//We need to clone the object otherwise we could not add new fields
        let children = newDojo.children;
        //We look at all the registered children to determine if the current user is registered/has registered children
        //and add it to the list of dojos we send the user
        children.forEach(function(child){
            if (child.parentEmail === authenticatedUserEmail) {
                logger.silly('User\'s child: ', JSON.stringify(child , undefined, 2));
                if (!newDojo.registered){
                    newDojo.registered = [];
                }
                newDojo.registered.push(child);
            }
        });
        logger.silly('Exit: addUsersRegisteredChildren');
        return newDojo;
    });
}


module.exports = router;