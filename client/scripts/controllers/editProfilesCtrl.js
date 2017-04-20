/**
 * Created by Paraschiv Adina on 3/11/2017.
 */

angular.module("coderDojoTimisoara")
    .controller("editProfilesCtrl", function($scope, $rootScope, $location, dataService, helperSvc){
        $scope.myProfile = {};
        $scope.myProfile.user = {};
        $scope.myProfile.views = {};


        //This method gets the user from the server and sets the view to "viewUserProfile"
        $scope.goToViewRootUserProfile = function(callback){
            $scope.getUserFromServer(function(err){
                if (err){
                    if(err.status === 401){
                        $location.path('/' + keys.login);
                    }
                    console.log(err);
                } else {
                    if($rootScope.user){
                        var user = helperSvc.cloneUser($rootScope.user);
                        //Setting the current user as the root user
                        $scope.myProfile.user = user;
                        // Getting the users children
                        if(user.children && user.children.length > 0){
                            $scope.getUsersChildrenFromServer(true);
                        }
                        // Getting the users parents
                        if(user.parents && user.parents.length > 0){
                            $scope.getUsersParentsFromServer(true);
                        }

                        //getting users notifications
                        getNotificationsForUser(true);

                        $scope.setView(keys.viewUserProfile);
                        if(callback){
                            callback();
                        }
                    }
                }
            });
        };

        //The same as the method above, only we get the local user, we do not go to the server
        $scope.goToViewRootUserProfileLocal = function(){
            var user = helperSvc.cloneUser($rootScope.user);
            //Setting the current user as the root user
            $scope.myProfile.user = user;
            $scope.setView(keys.viewUserProfile);
        };

        //Getting the user and setting viewUserProfile view
        $scope.goToViewRootUserProfile();

        //Method that get the user's children from the server and sets then to the current user
        $scope.getUsersChildrenFromServer = function(saveToRoot){
            handleParentsOrChildren(dataService.getChildren(), 'children', saveToRoot);

        };

        //Method that get the user's parents from the server and sets then to the current user
        $scope.getUsersParentsFromServer = function(saveToRoot){
            handleParentsOrChildren(dataService.getUsersParents(), 'parents', saveToRoot);
        };

        // Method user to get a child (that is not the logged in user but a child of the logged in user) parents from the
        // server.
        $scope.getChildsParentsFromServer = function(parents, callback){
            dataService.getChildsParents(parents)
                .then(function(response){
                    if(response.data.errors){
                        console.log('Error: ' + response.data.errors)
                    } else if (response.data.parents){
                        callback(helperSvc.cloneArrayOfUsers(response.data.parents));
                    }
                })
        };

        //Method that takes in a promise as answer from the server, an answer for a call for children or parents, and
        // sets the users parents or children based on the "childrenOrParents" argument;
        var handleParentsOrChildren = function(answerFromServer, childrenOrParents, saveToRoot, callback){
            answerFromServer
                .then(function(response){
                    if(response.data.errors){
                        console.error(response.data.errors);
                    } else if (response.data[childrenOrParents]){
                        $scope.myProfile.user[childrenOrParents] = helperSvc.cloneArrayOfUsers(response.data[childrenOrParents]);
                        if(saveToRoot){
                            $rootScope.user[childrenOrParents] = helperSvc.cloneArrayOfUsers(response.data[childrenOrParents]);
                        }
                        if(callback){
                            callback();
                        }
                    }
                })
                .catch(function(err){
                    if(err.status === 401){
                        //If not authorized, we try to get the user again (if that fails, we go to login screen)
                        $scope.goToViewRootUserProfile();
                    } else {
                        console.error(err);
                    }
                });
        };


        var getNotificationsForUser = function(setToRoot){
            getNotificationsForUserFromServer(function(err, notificationObject){
                if(err){
                    console.log(err);
                }else {
                    //If the user currently displayed is the owner of the notifications (in case of slow communication)
                    if(notificationObject.ownerOfNotifications == $scope.myProfile.user._id){
                        $scope.myProfile.user.notifications = notificationObject.notifications;
                    }
                    if(setToRoot && notificationObject.ownerOfNotifications == $rootScope.user._id){
                        $rootScope.user.notifications = notificationObject.notifications;
                    }
                }
            })
        };

        var getNotificationsForUserFromServer = function(callback){
            dataService.getNotificationsForUser()
                .then(function(response){
                    if(response.data.notificationObject){
                        callback(null, response.data.notificationObject)
                    } else {
                        callback(new Error('Problem receiving notifications'));
                    }
                })
                .catch (function(err){
                    callback(err);
                })
        };


        var getNotificationsForUsersChild = function(child){
            dataService.getNotificationsForUsersChild({childId: child._id})
                .then(function(response){
                    var notificationObject = response.data.notificationObject;
                    if(notificationObject){
                        if(notificationObject.ownerOfNotifications == $scope.myProfile.user._id){
                            $scope.myProfile.user.notifications = notificationObject.notifications;
                        }
                    }
                })
                .catch(function(err){
                    console.log(err);
                })

        };

        //Method that takes appropriate action based on the user selected
        $scope.saveAction = function(){
            if (isCurrentView(keys.editUserProfile)){
                $scope.editUser();
            } else if (isCurrentView(keys.addChildUnder14Profile)){
                $scope.createUserUnder14ByParent();
            } else if (isCurrentView(keys.addChildOver14Profile)){
                $scope.createUserOver14ByParent();
            } else if(isCurrentView(keys.editChildUnder14Profile) || isCurrentView(keys.editChildOver14Profile)){
                $scope.editUsersChild(keys.editChildUnder14Profile);
            }
        };


        $scope.editAction = function(){
            //Old view is viewUserProfile
            if(isCurrentView(keys.viewUserProfile)){
                $scope.setView(keys.editUserProfile);
                //A child has to be able to invite parents
                if($scope.isChild($scope.myProfile.user.birthDate)){
                    $scope.myProfile.views.showInviteParent = true;
                } else {
                    $scope.myProfile.views.showAddChildren = true;
                }
            }
            //Old view is viewChildProfile
            else if (isCurrentView(keys.viewUsersChildProfile)){
                //The user is now the child, and we check it's age
                if(helperSvc.isAgeLessThen14($scope.myProfile.user.birthDate)){
                    $scope.setView(keys.editChildUnder14Profile);
                } else {
                    $scope.setView(keys.editChildOver14Profile);
                    $scope.myProfile.views.passwords = true;
                }
                $scope.myProfile.views.showInviteParent = true;
                $scope.myProfile.views.showAlias = true;
            }
        };

        $scope.goBackAction = function(){
            //We reset errors that may remain
            $scope.resetErrors();

            if(isCurrentView(keys.addChildUnder14Profile) || isCurrentView(keys.addChildOver14Profile) ||
                        isCurrentView(keys.editUserProfile)){
                $scope.goToViewRootUserProfileLocal();

            } else if(isCurrentView(keys.editChildUnder14Profile) || isCurrentView(keys.editChildOver14Profile)){
                $scope.setView(keys.viewUsersChildProfile);
            }


        };

        //Method that adds a user under 14 for the current parent user
        $scope.createUserUnder14ByParent = function(){
            var errors = helperSvc.validateFields($scope.myProfile.user, keys.regChildUnder14Profile);
            if (errors){
                $scope.myProfile.errors = errors;
            } else {
                $scope.myProfile.user.userType = keys.regChildUnder14Profile;
                dataService.registerChild($scope.myProfile.user)
                    .then(function(response){
                        if(response.data.errors){
                            $scope.myProfile.errors = helperSvc.convertServerErrorsToClientErrors(response.data.errors);
                        }else {
                            if(response.data.success){
                                //If the child was saved, get the user from the server and go to view the parents profiles
                                $scope.goToViewRootUserProfile();
                            } else {
                                console.log(JSON.stringify(response.data));
                            }
                        }
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err);
                    })
            }
        };

        //Method that adds a user under 14 for the current parent user
        $scope.createUserOver14ByParent = function(){
            var errors = helperSvc.validateFields($scope.myProfile.user, keys.regChildOver14Profile);
            if (errors){
                $scope.myProfile.errors = errors;
            } else {
                $scope.myProfile.user.userType = keys.regChildOver14Profile;
                dataService.registerChild($scope.myProfile.user)
                    .then(function(response){
                        if(response.data.errors){
                            $scope.myProfile.errors = helperSvc.convertServerErrorsToClientErrors(response.data.errors);
                        }else {
                            if(response.data.success){
                                //If the child was saved, get the user from the server and go to view the parents profiles
                                $scope.goToViewRootUserProfile();
                            } else {
                                console.log(JSON.stringify(response.data));
                            }
                        }
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err);
                    })
            }
        };

        $scope.viewParentAction = function(parent){
            //If the old profile is viewChildProfile
            if($scope.myProfile.views[keys.viewUsersChildProfile]){
                //If the parent is the root user
                if(isSameUser($rootScope.user, parent)){
                    $scope.goToViewRootUserProfileLocal();
                }
                //If the parent is not the root user
                else {
                    //The current user is the child of the parent selected, and we add it exclusively to the list of
                    // children of the selected parent
                    parent.children = [];
                    parent.children.push($scope.myProfile.user);
                    $scope.myProfile.user = parent;
                    $scope.setView(keys.viewOtherParentProfile);
                    $scope.myProfile.views.hideEditButton = true;
                }
            }
        };

        //Method for setting the view to viewChildProfile
        $scope.viewChildAction = function(child){
            //If the old profile is viewUserProfile
            if($scope.myProfile.views[keys.viewUserProfile]){
                //Setting the child as the current user
                $scope.myProfile.user = child;
                $scope.setView(keys.viewUsersChildProfile);
                var childsParents = JSON.parse(JSON.stringify(child.parents));
                //If the child has parents, get the parents from the server
                if(childsParents && childsParents.length > 0){
                    // Resetting the parents until we get an answer from the server
                    $scope.myProfile.user.parents = [];
                    $scope.getChildsParentsFromServer(childsParents, function(parents){
                        $scope.myProfile.user.parents = parents;
                    });
                }
                //Getting the notifications for this child
                getNotificationsForUsersChild(child);

            }
            //If the old profile is viewOtherParentProfile
            else if ($scope.myProfile.views[keys.viewOtherParentProfile]){
                //If the child is the root user
                if(isSameUser(child, $rootScope.user)){
                    $scope.goToViewRootUserProfileLocal();
                }
                else {
                    //Setting the child as the current user
                    $scope.myProfile.user = child;
                    $scope.setView(keys.viewUsersChildProfile);
                    $scope.getUsersParentsFromServer(false);
                    //Getting the notifications for this child
                    getNotificationsForUsersChild(child);
                }
            }
        };

        $scope.setView = function(view){
            //resetting all views
            $scope.myProfile.views = {};
            //resetting all errors
            $scope.myProfile.errors = {};
            $scope.$emit('viewChange', view);

            //setting the new view
            $scope.myProfile.views[view] = true;
        };

        // Method to determine if the current view is thisView
        var isCurrentView = function(thisView){
            return $scope.myProfile.views[thisView];
        };

        //This changes the view from Edit to View and From View to Edit
        $scope.$on('viewChange', function(event, view){
            //This is for edit
            if(view === keys.editUserProfile || view === keys.editChildOver14Profile || view === keys.editChildUnder14Profile ||
               view === keys.addChildOver14Profile ||  view === keys.addChildUnder14Profile){
                    $scope.myProfile.views.viewProfile = false;
                    $scope.myProfile.views.editProfile = true;
            } else if (view === keys.viewUserProfile || view === keys.viewUsersChildProfile ||
                       view === keys.viewOtherParentProfile){
                $scope.myProfile.views.editProfile = false;
                $scope.myProfile.views.viewProfile = true;
            }
        });

        $scope.editUsersChild = function(){
            var typeOfChild = keys.editChildOver14Profile;
            //We determine what type of child we are editing
            if(helperSvc.isAgeLessThen14($scope.myProfile.user.birthDate)){
                typeOfChild = keys.editChildUnder14Profile;
            };
            var errors = helperSvc.validateFields($scope.myProfile.user, typeOfChild);
            if(errors){
                $scope.myProfile.errors = errors;
            } else {
                $scope.myProfile.user.userType = typeOfChild;
                dataService.editUsersChild($scope.myProfile.user)
                    .then(function(response){
                        if(response.data.errors){
                            if(response.data.errors === keys.wrongUserError){
                                //Display an alert notifying the user that the operation did not succeed
                                $scope.setAlert(keys.errorAlert, 'Probleme de comunicare cu serverul, te rugăm să mai încerci.');
                            } else {
                                $scope.myProfile.errors = helperSvc.convertServerErrorsToClientErrors(response.data.errors);
                            }
                        } else if (response.data.success){
                            $scope.goToViewRootUserProfile(function(){
                                $scope.setAlert(keys.infoAlert, 'Modificări salvate cu succes.');

                            });
                        }
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err);
                    });
            }

        }

        //Method that modifies the account for a user that is not a child
        $scope.editUser = function(){
            var errors = helperSvc.validateFields($scope.myProfile.user, keys.editUserOver14Profile);
            if (errors){
                $scope.myProfile.errors = errors;
            } else {
                $scope.myProfile.user.userType = keys.editUserOver14Profile;
                dataService.editUser($scope.myProfile.user)
                    .then(function(response){
                        if(response.data.errors){
                            if(response.data.errors === keys.wrongUserError){
                                $scope.setAlert(keys.errorAlert, 'Probleme de comunicare cu serverul, te rugăm să mai încerci.');
                            } else {
                                $scope.myProfile.errors = helperSvc.convertServerErrorsToClientErrors(response.data.errors);
                            }
                        } else if (response.data.success){
                            $scope.goToViewRootUserProfile(function(){
                                $scope.setAlert(keys.infoAlert, 'Utilizatorul a fost modificat cu success');

                            });

                        } else {
                            console.log('Error: response without success!')
                        }
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err);
                    });
            }
        };

        //Method that returns a date with only year, month and day
        $scope.getPrettyDate = function(){
            if($scope.myProfile.user.birthDate){
                if (typeof $scope.myProfile.user.birthDate === 'string'){
                    $scope.myProfile.user.birthDate = new Date($scope.myProfile.user.birthDate);
                }
                return helperSvc.prettyDate($scope.myProfile.user.birthDate, false);
            }
        };

        //Method that opens the panel for adding a child under 14
        $scope.addChildUnder14Action = function(){
            //Set an empty user
            $scope.myProfile.user = {};
            //set the correct view
            $scope.setView(keys.addChildUnder14Profile);
            //Add the alias field
            $scope.myProfile.views.showAlias = true;
            helperSvc.scrollToTop();
        };

        //Method that opens the panel for adding a child over 14
        $scope.addChildOver14Action = function(){
            //Set an empty user
            $scope.myProfile.user = {};
            //set the correct view
            $scope.setView(keys.addChildOver14Profile);
            //Show passwords in the addChildOver14Panel
            $scope.myProfile.views.password = true;
            //Add the alias field
            $scope.myProfile.views.showAlias = true;
            helperSvc.scrollToTop();
        };

        $scope.resetErrors = function(){
            $scope.myProfile.errors = {};
        };

        //Is child returns true if the age is under 18
        $scope.isChild = function(){
            return !helperSvc.isAgeGreaterThen18($scope.myProfile.user.birthDate);
        }

        $scope.inviteParent = function(){
            var errors = helperSvc.validateEmailForInvite($scope.myProfile.emailParent);
            if(errors){
                $scope.myProfile.errors = errors;
            } else {
                var invitation = {};
                invitation.parentEmail = $scope.myProfile.emailParent;
                invitation.child = {
                    firstName: $scope.myProfile.user.firstName,
                    lastName: $scope.myProfile.user.lastName,
                    alias: $scope.myProfile.user.alias,
                    _id: $scope.myProfile.user._id
                };
                dataService.inviteParent({invitation:invitation})
                    .then(function(response){
                        if(response.data.errors){
                            $scope.myProfile.errors = helperSvc.convertServerErrorsToClientErrors(response.data.errors);
                        } else if(response.data.success){
                            $scope.myProfile.emailParent = undefined;
                            $scope.setAlert(keys.infoAlert, 'Invitația a fost trimisă cu succes!');
                        }
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err);
                    });
            }
        };

        $scope.acceptChildInvite = function(notification){
            dataService.acceptChildInvite({notifId:notification._id})
                .then(function(response){
                    if(response.data.error){
                        helperSvc.handlerCommunicationErrors(err);
                    } else if(response.data.success){
                        getNotificationsForUser();
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err);
                })
        };

        $scope.cancelChildInvite = function(notification){
            deleteNotificationForUser(notification);
        };

        var deleteNotificationForUser = function(notification){
            dataService.deleteNotificationForUser({notifId:notification._id})
                .then(function(response){
                    if(response.data.error){
                        helperSvc.handlerCommunicationErrors(err);
                    } else if(response.data.success){
                        getNotificationsForUser();
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err);
                })
        }

        $scope.dismissNotification = function(notification){
            if(isCurrentView(keys.viewUserProfile)){
                deleteNotificationForUser(notification);
            } else if (isCurrentView(keys.viewUsersChildProfile)){
                deleteUsersChildNotification(notification);
            }
        }

        var deleteUsersChildNotification = function(notification){
            var childId = $scope.myProfile.user._id;
            dataService.deleteNotificationForUsersChild({notifId:notification._id, childId: childId})
                .then(function(response){
                    if(response.data.success){
                        //We make sure the the user has not changed since we made de request
                        if(childId === $scope.myProfile.user._id){
                            getNotificationsForUsersChild($scope.myProfile.user);
                        }
                    }
                })
                .catch(function(err){
                    helperSvc.handleParentsOrChildren(err);
                })
        }

        var isSameUser = function(user1, user2){
            if(user1 && user2){
                return user1._id === user2._id;
            }
        }
    });