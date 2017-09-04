/**
 * Created by Paraschiv Adina on 3/11/2017.
 */

angular.module("coderDojoTimisoara")
    .controller("addOrEditProfileCtrl", function($scope, $rootScope, $location, $compile, dataService, helperSvc){
        $scope.isEditProfilesCtrlParent = true;
        $scope.myProfile = {};
        $scope.myProfile.user = {};
        $scope.myProfile.views = {};
        $scope.myProfile.sanitize = {};
        var communicationsPermitted = true;
        //This is for stuff that needs to be run only once when the controller per controller load
        $scope.myProfile.initializations = {};

        $scope.getUserPictureURL = function(){
            if($scope.myProfile.user.userPhoto){
                return 'background-image:url(\'../img/user_photos/' + $scope.myProfile.user.userPhoto + '\')';
            } else {
                return 'background-image:url(\'../img/user_photos/poza_profil.png\')';
            }
        };


        //This method gets the user from the server and sets the view to "viewUserProfile"
        $scope.initializeEditProfilesController = function(callback){
            $scope.getUserFromServer(function(err){
                if (err){
                    helperSvc.handlerCommunicationErrors(err, 'coderDojoTimisoara - initializeEditProfilesController',
                        $scope);
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
                        getNotificationsForUser(true);//TODO move this to the main controller
                        //reset notification info bubble

                        //getting users dojos
                        getUsersDojosFromServer();

                        //getting uses badges
                        $scope.getBadges();

                        $scope.setView(keys.viewUserProfile, [keys.showDojoInUserProfile]);
                        //Reset initializations

                        if(callback){
                            callback();
                        }
                    }
                }
            });
        };

        var resetSanitize = function(){
            $scope.myProfile.sanitize = {};
        };

        //This method resets the flags so that the listeners for user photo changes can be activated.
        var resetInitializations = function(){
            $scope.myProfile.initializations = {};
        };

        //Getting the user and setting viewUserProfile view
        $scope.initializeEditProfilesController();

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
                        $scope.initializeEditProfilesController();
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
                        $scope.resetNewNotificationCount();
                    }
                    if(setToRoot && (notificationObject.ownerOfNotifications == $rootScope.user._id)){
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
                        callback({msg:'Notification object not received'});
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
            //We can only save if communications are permitted (other communications are not ongoing)
            if(communicationsPermitted){
                if ($scope.isCurrentView(keys.editUserProfile)){
                    $scope.editUser();
                } else if ($scope.isCurrentView(keys.addChildUnder14Profile)){
                    $scope.createUserUnder14ByParent();
                } else if ($scope.isCurrentView(keys.addChildOver14Profile)){
                    $scope.createUserOver14ByParent();
                } else if($scope.isCurrentView(keys.editChildUnder14Profile) || $scope.isCurrentView(keys.editChildOver14Profile)){
                    $scope.editUsersChild();
                }
            }

        };

        $scope.setCommunicationsPermitted = function(newCommunicationsPermitted){
            communicationsPermitted = newCommunicationsPermitted;
        };

        $scope.changeUserIdentification = function(){
            if(communicationsPermitted){
                //The change passwords and change identifications panels cannot be open simultaneously
                $scope.removeView(keys.viewChangePasswordsPanel);
                $scope.addView(keys.viewChangeIdentificationsPanel)
            }
        };

        $scope.closeChangeInfoWindows = function(){
            $scope.removeView(keys.viewChangeIdentificationsPanel);
        };

        $scope.closeChangePasswordWindows = function(){
            $scope.removeView(keys.viewChangePasswordsPanel);
        };

        $scope.changeUserPasswords = function(){
            if(communicationsPermitted){
                //The change passwords and change identifications panels cannot be open simultaneously
                $scope.removeView(keys.viewChangeIdentificationsPanel);
                $scope.addView(keys.viewChangePasswordsPanel)
            }
        };

        var isCurrentViewEditing = function(){
            return $scope.isCurrentView(keys.editUserProfile) || $scope.isCurrentView(keys.addChildUnder14Profile) ||
                $scope.isCurrentView(keys.addChildOver14Profile) || $scope.isCurrentView(keys.editChildUnder14Profile) ||
                $scope.isCurrentView(keys.editChildOver14Profile);
        };


        $scope.editAction = function(){
            //Old view is viewUserProfile
            if($scope.isCurrentView(keys.viewUserProfile)){
                if($scope.isChild($scope.myProfile.user.birthDate)){
                    $scope.setView(keys.editUserProfile, [keys.showInviteParent, keys.showChangePasswords, keys.showChangeIdentification]);
                } else {
                    $scope.setView(keys.editUserProfile, [keys.showAddChildren, keys.showChangePasswords, keys.showChangeIdentification]);
                }
            }
            //Old view is viewChildProfile
            else if ($scope.isCurrentView(keys.viewUsersChildProfile)){
                //The user is now the child, and we check it's age
                if(helperSvc.isAgeLessThen14($scope.myProfile.user.birthDate)){
                    var extraViews = [keys.showInviteParent, keys.showAlias, keys.showChangeIdentification];
                    $scope.setView(keys.editChildUnder14Profile, extraViews);
                } else {
                    var extraViews = [keys.showInviteParent, keys.showAlias, keys.showChangePasswords, keys.showChangeIdentification];
                    $scope.setView(keys.editChildOver14Profile, extraViews);
                }


            }
        };

        $scope.goBackAction = function(){
            //We can only go back if communications are permited
            if(communicationsPermitted){
                //We reset errors that may remain
                $scope.resetErrors();
                resetSanitize();
                if($scope.isCurrentView(keys.addChildUnder14Profile) || $scope.isCurrentView(keys.addChildOver14Profile) ||
                    $scope.isCurrentView(keys.editUserProfile)){
                    resetInitializations();
                    $scope.initializeEditProfilesController();

                } else if($scope.isCurrentView(keys.editChildUnder14Profile) || $scope.isCurrentView(keys.editChildOver14Profile)){
                    resetInitializations();
                    $scope.setView(keys.viewUsersChildProfile);//TODO need to ad refresh for this user as it could have been modified
                }
            }

        };

        //Method for opening dialog for adding user picture
        $scope.loadPicture = function(){
            var $fileInput = $('#user-photo-input');
            //This is so the listener is only added once
            if(!($scope.myProfile.initializations[keys.uploadPhotoListenerInitiated])){
                $fileInput.on('change', function(event){
                    communicationsPermitted = false;
                    //This event triggers when the users selects a file
                    var $fileInput = $('#user-photo-input');
                    //we check to see if a file was selected
                    if ($fileInput[0].files.length > 0){
                        //We build a formData from the hidden file input used
                        var formData = new FormData();
                        formData.append('userId', $scope.myProfile.user._id);
                        formData.append('user-photo', $fileInput[0].files[0]);
                        dataService.uploadUserPhoto(formData)
                            .then(function(response){
                                communicationsPermitted = true;
                                if(response.data.errors === keys.uploadedPhotoTooLargeError){
                                    $scope.setSnackBar('Poza este prea mare. Maxim 500 de kb', 'error');
                                } else if (response.data.errors === keys.uploadedPhotoNotCorrectMimeTypeError){
                                    $scope.setSnackBar('Poza nu este un format acceptat (jpg, png).', 'error');
                                } else if (response.data.errors === keys.wrongUserError){
                                    $scope.showNotAuthorizedError();
                                } else if(response.data.userPhoto){
                                    //THe same user that changed the photo is the current user
                                    if(response.data.userId === $scope.myProfile.user._id){
                                        $scope.myProfile.user.userPhoto = response.data.userPhoto;
                                        var msg = 'Poza lui '  + $scope.myProfile.user.firstName + ' '  +
                                            $scope.myProfile.user.lastName + ' a fost schimbata cu success';
                                        $scope.setSnackBar(msg, 'info');
                                        if(response.data.userId === $rootScope.user._id){
                                            helperSvc.updateUserPhotoThumbnailWhenChangingPhoto(response.data.userPhoto);
                                        }
                                    }
                                }
                            })
                            .catch(function(err){
                                console.log(err);
                                communicationsPermitted = true;
                            });
                    }
                });
                //We set the initialized flag to true, for the event listener to be activated only once
                $scope.myProfile.initializations[keys.uploadPhotoListenerInitiated] = true;
            }
            //We simulate a click on the hidden file input to open the dialog
            $fileInput.click();
        };


        //Method that adds a user under 14 for the current parent user
        $scope.createUserUnder14ByParent = function(){
            resetSanitize();
            var errors = helperSvc.validateFields($scope.myProfile.user, keys.regChildUnder14Profile);
            if (errors){
                $scope.myProfile.errors = errors;
                $scope.setSnackBar('Exista erori in formular', 'error');
            } else {
                communicationsPermitted = false;
                $scope.myProfile.user.userType = keys.regChildUnder14Profile;
                dataService.registerChild($scope.myProfile.user)
                    .then(function(response){
                        communicationsPermitted = true;
                        if(response.data.errors){
                            $scope.myProfile.errors = helperSvc.convertServerErrorsToClientErrors(response.data.errors);
                            $scope.setSnackBar('Exista erori in formular', 'error');
                        } else if (response.data.sanitizedUser){
                            var sanitizedChild = response.data.sanitizedUser;
                            $scope.myProfile.sanitize.hasBeenSanitized = true;
                            prepareSanitizedUser(sanitizedChild, $scope.myProfile.user);
                            addSanitizeFlags($scope.myProfile.user, sanitizedChild);
                            $scope.myProfile.user = sanitizedChild;
                            $scope.setSnackBar('Exista erori in formular', 'error');

                        } else if(response.data.success){
                            //If the child was saved, get the user from the server and go to view the parents profiles
                            $scope.initializeEditProfilesController();
                            var user = $scope.myProfile.user;
                            var msg = 'Utilizatorul ' + user.firstName + ' ' + user.lastName + ' a fost creeat cu succes';
                            $scope.setAlert(keys.infoAlert, msg);
                        }
                    })
                    .catch(function(err){
                        communicationsPermitted = true;
                        helperSvc.handlerCommunicationErrors(err, 'createUserUnder14ByParent - editProfileCtrl', $scope);
                    })
            }
        };

        //Method that adds a user under 14 for the current parent user
        $scope.createUserOver14ByParent = function(){
            resetSanitize();
            var errors = helperSvc.validateFields($scope.myProfile.user, keys.regChildOver14Profile);
            if (errors){
                $scope.myProfile.errors = errors;
                $scope.setSnackBar('Exista erori in formular', 'error');
            } else {
                communicationsPermitted = false;
                $scope.myProfile.user.userType = keys.regChildOver14Profile;
                dataService.registerChild($scope.myProfile.user)
                    .then(function(response){
                        communicationsPermitted = true;
                        if(response.data.errors){
                            $scope.myProfile.errors = helperSvc.convertServerErrorsToClientErrors(response.data.errors);
                            $scope.setSnackBar('Exista erori in formular', 'error');
                        }else {
                            if (response.data.sanitizedUser){
                                var sanitizedChild = response.data.sanitizedUser;
                                //We check that the message was not received after we left the child adding view
                                $scope.myProfile.sanitize.hasBeenSanitized = true;
                                prepareSanitizedUser(sanitizedChild, $scope.myProfile.user);
                                addSanitizeFlags($scope.myProfile.user, sanitizedChild);
                                $scope.myProfile.user = sanitizedChild;
                                $scope.setSnackBar('Exista erori in formular', 'error');

                            } else if(response.data.success){
                                var msg = 'Utilizatorul ' + user.firstName + ' ' + user.lastName + ' a fost creeat cu succes';
                                $scope.setAlert(keys.infoAlert, msg);
                                //If the child was saved, get the user from the server and go to view the parents profiles
                                $scope.initializeEditProfilesController();
                            }
                        }
                    })
                    .catch(function(err){
                        communicationsPermitted = true;
                        helperSvc.handlerCommunicationErrors(err, 'createUserOver14ByParent - editProfilesCtrl', $scope);
                    })
            }
        };

        $scope.viewParentAction = function(parent){
            resetBadges();
            //If the old profile is viewChildProfile
            if($scope.isCurrentView(keys.viewUsersChildProfile)){
                //If the parent is the root user
                if(isSameUser($rootScope.user, parent)){
                    $scope.initializeEditProfilesController();
                    $scope.getBadges();
                }
                //If the parent is not the root user
                else {
                    //The current user is the child of the parent selected, and we add it exclusively to the list of
                    // children of the selected parent
                    parent.children = [];
                    parent.children.push($scope.myProfile.user);
                    //We clone the child to avoid json circular exceptions when converting for saving
                    parent = angular.copy(parent);
                    $scope.myProfile.user = parent;
                    $scope.setView(keys.viewOtherParentProfile, [keys.hideEditButton]);
                }
            }
            else if($scope.isCurrentView(keys.viewUserProfile)){
                //TODO go to parent's child profile
                parent.children = [];
                parent.children.push($scope.myProfile.user);
                //We clone the child to avoid json circular exceptions when converting for saving
                parent = angular.copy(parent);
                $scope.myProfile.user = parent;
                $scope.setView(keys.viewOtherParentProfile, [keys.hideEditButton]);
            }
        };

        //Method for setting the view to viewChildProfile
        $scope.viewChildAction = function(child){
            //Resetting badges
            resetBadges();
            //If the old profile is viewUserProfile
            if($scope.myProfile.views[keys.viewUserProfile]){
                //Setting the child as the current user
                $scope.myProfile.user = child;
                $scope.setView(keys.viewUsersChildProfile, [keys.showDojoInUserProfile]);
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

                //Getting dojos for child
                getUsersChildsDojosFromServer(child._id);

                //getting badges
                $scope.getBadges();
            }
            //If the old profile is viewOtherParentProfile
            else if ($scope.myProfile.views[keys.viewOtherParentProfile]){
                //If the child is the root user
                if(isSameUser(child, $rootScope.user)){
                    $scope.initializeEditProfilesController();

                    //getting badges
                    $scope.getBadges();
                }
                else {
                    //Setting the child as the current user
                    //We clone the child to avoid json circular exceptions when converting for saving
                    child = angular.copy(child);
                    $scope.myProfile.user = child;
                    $scope.setView(keys.viewUsersChildProfile, [keys.showDojoInUserProfile]);
                    $scope.getUsersParentsFromServer(false);

                    //Getting the notifications for this child
                    getNotificationsForUsersChild(child);

                    //Getting dojos for child
                    getUsersChildsDojosFromServer(child._id);

                    //getting badges
                    $scope.getBadges();
                }
            }
        };

        //Methor that resets the current views, and sets a new view
        $scope.setView = function(view, extraShowFlags){
            //resetting all views
            $scope.myProfile.views = {};
            //resetting all errors
            $scope.myProfile.errors = {};
            $scope.$emit('viewChange', view);

            //setting the new view
            $scope.myProfile.views[view] = true;

            //If we need to add extra show flags beside the original
            if(extraShowFlags){
                extraShowFlags.forEach(function(flag){
                    $scope.myProfile.views[flag] = true;
                })
            }
        };

        //Method for adding view without resetting previous views.
        $scope.addView = function(view){
            $scope.myProfile.views[view] = true;
        };

        //Method for removing a view
        $scope.removeView = function(view){
            $scope.myProfile.views[view] = false;
        };

        // Method to determine if the current view is thisView
        $scope.isCurrentView = function(thisView){
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
            resetSanitize();
            //We determine what type of child we are editing
            var typeOfChild = keys.editChildOver14Profile;
            if(helperSvc.isAgeLessThen14($scope.myProfile.user.birthDate)){
                typeOfChild = keys.editChildUnder14Profile;
            }
            var errors = helperSvc.validateFields($scope.myProfile.user, typeOfChild);
            if(errors){
                $scope.myProfile.errors = errors;
                $scope.setSnackBar('Exista erori in formular', 'error');
            } else {
                communicationsPermitted = false;
                var editedChild = prepareEditedUser($scope.myProfile.user);
                editedChild.userType = typeOfChild;
                dataService.editUsersChild(editedChild)
                    .then(function(response){
                        communicationsPermitted = true;
                        if(response.data.errors){
                            if(response.data.errors === keys.notAuthorizedError){
                                $scope.showNotAuthorizedError();
                            } else {
                                $scope.myProfile.errors = helperSvc.convertServerErrorsToClientErrors(response.data.errors);
                                $scope.setSnackBar('Exista erori in formular', 'error');
                            }
                        } else if (response.data.sanitizedUser){
                            var sanitizedChild = response.data.sanitizedUser;
                            //We check that the message was not received after the user was changed in the profile,
                            // and the current view is a profile that shows sanitization
                            if((editedChild._id == sanitizedChild._id) &&
                                isCurrentViewEditing()){
                                $scope.myProfile.sanitize.hasBeenSanitized = true;
                                prepareSanitizedUser(sanitizedChild, $scope.myProfile.user);
                                addSanitizeFlags($scope.myProfile.user, sanitizedChild);
                                $scope.myProfile.user = sanitizedChild;
                            }
                            $scope.setSnackBar('Exista erori in formular', 'error');

                        }else if (response.data.success){
                            $scope.initializeEditProfilesController(function(){
                                $scope.setAlert(keys.infoAlert, 'Modificări salvate cu succes.');
                            });
                        }
                    })
                    .catch(function(err){
                        communicationsPermitted = true;
                        helperSvc.handlerCommunicationErrors(err, 'editUsersChild - editProfilesCtrl', $scope);
                    });
            }

        };

        //Method that selects what fields are send to the server when editing a child/user
        var prepareEditedUser = function(user){
            var retUser = {};
            retUser.firstName = user.firstName;
            retUser.lastName = user.lastName;
            retUser.birthDate = user.birthDate;
            retUser.address = user.address;
            retUser.phone = user.phone;
            retUser.facebook = user.facebook;
            retUser.linkedin = user.linkedin;
            retUser.languagesSpoken = user.languagesSpoken;
            retUser.programmingLanguages = user.programmingLanguages;
            retUser.biography = user.biography;
            retUser.gender = user.gender;
            retUser._id = user._id;
            retUser.alias = user.alias;
            return retUser;
        };

        //Method that modifies the account for a user that is not a child
        $scope.editUser = function(){
            resetSanitize();
            var errors = helperSvc.validateFields($scope.myProfile.user, keys.editUserOver14Profile);
            if (errors){
                $scope.myProfile.errors = errors;
                $scope.setSnackBar('Exista erori in formular', 'error');
            } else {
                //disable further communications until answer is received
                communicationsPermitted = false;
                $scope.myProfile.user.userType = keys.editUserOver14Profile;
                var preparedUser = prepareEditedUser($scope.myProfile.user);
                dataService.editUser(preparedUser)
                    .then(function(response){
                        communicationsPermitted = true;
                        if(response.data.errors){
                            //TODO check if this is a valid action
                            if(response.data.errors === keys.notAuthorizedError){
                                $scope.showNotAuthorizedError();
                            } else {
                                $scope.myProfile.errors = helperSvc.convertServerErrorsToClientErrors(response.data.errors);
                                $scope.setSnackBar('Exista erori in formular', 'error');
                            }
                        } else if (response.data.sanitizedUser){
                            var sanitizedUser = response.data.sanitizedUser;
                            //We check that the message was not received after the user was changed in the profile,
                            // and the current view is a profile that shows sanitization
                            if((preparedUser._id == sanitizedUser._id) &&
                                isCurrentViewEditing()){
                                $scope.myProfile.sanitize.hasBeenSanitized = true;
                                prepareSanitizedUser(sanitizedUser, $scope.myProfile.user);
                                addSanitizeFlags($scope.myProfile.user, sanitizedUser);
                                $scope.myProfile.user = sanitizedUser;
                            }
                            $scope.setSnackBar('Exista erori in formular', 'error');

                        } else if (response.data.success){
                            $scope.initializeEditProfilesController(function(){
                                $scope.setAlert(keys.infoAlert, 'Utilizatorul a fost modificat cu success');
                            });

                        }
                    })
                    .catch(function(err){
                        communicationsPermitted = true;
                        helperSvc.handlerCommunicationErrors(err, 'editUser - editProfilesCtrl', $scope);
                    });
            }
        };

        var prepareSanitizedUser = function(sanitizedUser, user){
            //The serialized date received from the server is a string, we convert it back to a date
            sanitizedUser.birthDate = new Date(sanitizedUser.birthDate);
            //The user from the server is also lacking the email and alias, which are not sent, as they
            // cannot be changed from this menu. FOr proper display, we need them
            sanitizedUser.email = user.email;
            sanitizedUser.alias = user.alias;
        };

        //This method adds the sanitized flags to the sanitized object. These flags will be used to indicate
        // which fields have been sanitized by the server.
        var addSanitizeFlags = function(user, sanitizedUser){
            if(user.email != sanitizedUser.email){
                $scope.myProfile.sanitize.email = true;
            }
            if(user.password != sanitizedUser.password){
                $scope.myProfile.sanitize.password = true;
            }
            if(user.firstName != sanitizedUser.firstName){
                $scope.myProfile.sanitize.firstName = true;
            }
            if(user.lastName != sanitizedUser.lastName){
                $scope.myProfile.sanitize.lastName = true;
            }
            if(user.birthDate.getTime() != sanitizedUser.birthDate.getTime()){
                $scope.myProfile.sanitize.birthDate = true;
            }
            if(user.address != sanitizedUser.address){
                $scope.myProfile.sanitize.address = true;
            }
            if(user.phone != sanitizedUser.phone){
                $scope.myProfile.sanitize.phone = true;
            }
            if(user.facebook != sanitizedUser.facebook){
                $scope.myProfile.sanitize.facebook = true;
            }
            if(user.linkedin != sanitizedUser.linkedin){
                $scope.myProfile.sanitize.linkedin = true;
            }
            if(user.languagesSpoken != sanitizedUser.languagesSpoken){
                $scope.myProfile.sanitize.languagesSpoken = true;
            }
            if(user.programmingLanguages != sanitizedUser.programmingLanguages){
                $scope.myProfile.sanitize.programmingLanguages = true;
            }
            if(user.biography != sanitizedUser.biography){
                $scope.myProfile.sanitize.biography = true;
            }
            if(user.gender != sanitizedUser.gender){
                $scope.myProfile.sanitize.gender = true;
            }
        };

        $scope.closeHasBeenSanitizedInfo = function(){
            $scope.myProfile.sanitize.hasBeenSanitized = false;
        };

        $scope.goToEvent = function(eventId){
            $scope.setEventView(eventId, keys.viewUserProfile);
            $scope.goToViewEvent();
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
            //We can add a child only if another communications is not ongoing
            if(communicationsPermitted){
                //Set an empty user
                $scope.myProfile.user = {};
                //set the correct view
                $scope.setView(keys.addChildUnder14Profile, [keys.showAlias]);
                helperSvc.scrollToTop();
            }
        };

        //Method that opens the panel for adding a child over 14
        $scope.addChildOver14Action = function(){
            //We can add a child only if another communications is not ongoing
            if(communicationsPermitted){
                //Set an empty user
                $scope.myProfile.user = {};
                //set the correct view
                $scope.setView(keys.addChildOver14Profile, [keys.showPasswords, keys.showAlias]);
                helperSvc.scrollToTop();
            }

        };

        $scope.isEmailReadOnly = function(){
            //The email input is readonly for all editing users
            return !$scope.isCurrentView(keys.addChildOver14Profile);
        };

        $scope.isAliasReadOnly = function() {
            //THe alias is readonly for all editing users
            return !$scope.isCurrentView(keys.addChildOver14Profile) && !$scope.isCurrentView(keys.addChildUnder14Profile);;
        };

        $scope.showEmailInEditing = function(){
            //Only show the email if the user already has email, or if we are adding a child over 14
            return ($scope.myProfile.user.email || $scope.isCurrentView(keys.addChildOver14Profile));
        };

        $scope.showAliasInEditing = function(){
            //Only show the alias if the user has an alias, or if a parent is adding a child
            return ($scope.myProfile.user.alias || $scope.isCurrentView(keys.addChildOver14Profile) ||
            $scope.isCurrentView(keys.addChildUnder14Profile));
        };

        $scope.showLinkedInInEditing = function(){
            //Don't show linkedIn if the user is under 14
            return (!$scope.isCurrentView(keys.addChildUnder14Profile) || $scope.isCurrentView(keys.editChildUnder14Profile));
        };

        $scope.showFacebookInEditing = function(){
            //same rules as linkedIn
            return $scope.showLinkedInInEditing();
        };

        $scope.resetErrors = function(){
            $scope.myProfile.errors = {};
        };

        //Is child returns true if the age is under 18
        $scope.isChild = function(){
            return !helperSvc.isAgeGreaterThen18($scope.myProfile.user.birthDate);
        };

        $scope.inviteParent = function(){
            //We can only invite parent in another communication is not ongoing
            if(communicationsPermitted){
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
                            helperSvc.handlerCommunicationErrors(err , 'editUser - editProfilesCtrl', $scope);
                        });
                }
            }
        };

        $scope.acceptChildInvite = function(notification){
            dataService.acceptChildInvite({notifId:notification._id})
                .then(function(response){
                    $scope.initializeEditProfilesController();
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err , 'acceptChildInvite - editProfilesCtrl', $scope);
                })
        };

        $scope.cancelChildInvite = function(notification){
            deleteNotificationForUser(notification);
        };

        var deleteNotificationForUser = function(notification){
            dataService.deleteNotificationForUser({notifId:notification._id})
                .then(function(response){
                    getNotificationsForUser();
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'deleteNotificationForUser - editProfilesCtrl', $scope);
                })
        };

        $scope.dismissNotification = function(notification){
            if($scope.isCurrentView(keys.viewUserProfile)){
                deleteNotificationForUser(notification);
            } else if ($scope.isCurrentView(keys.viewUsersChildProfile)){
                deleteUsersChildNotification(notification);
            }
        };

        //Method for informing controllers that are children of this controller where they are
        $scope.whereAmI = function(){
            return 'editProfilesCtrl';
        };

        //Method that retrieves a user's dojos from the server
        var getUsersDojosFromServer = function(){
            var curUserId = $scope.myProfile.user._id;
            dataService.getMyDojos()
                .then(function(response){
                    if(response.data.dojos){
                        //Check that the user making the request is the current user
                        if(response.data.userId === curUserId){
                            $scope.myProfile.user.dojos = response.data.dojos;
                        }
                    } else {
                        console.log('No dojos in answer error');
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getUsersDojos - editProfilesCtrl', $scope);
                })
        };

        //Method that retrieves a user's dojos from the server
        var getUsersChildsDojosFromServer = function(childId){
            var curUserId = $scope.myProfile.user._id;
            dataService.getMyChildsDojos({childId: childId})
                .then(function(response){
                    if(response.data.errors === keys.wrongUserError){
                        console.log('User is not parent of child error!');
                    }
                    else if(response.data.dojos){
                        //Check that the user making the request is the current user
                        if(response.data.childId === curUserId){
                            $scope.myProfile.user.dojos = response.data.dojos;
                        }
                    } else {
                        console.log('No dojos in answer error');
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getUsersDojos - editProfilesCtrl', $scope);
                })
        };

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
                    helperSvc.handlerCommunicationErrors(err, 'deleteUsersChildNotification - editProfilesCtrl', $scope);
                })
        };

        var isSameUser = function(user1, user2){
            if(user1 && user2){
                return user1._id === user2._id;
            }
        };



        //These methods are user by the viewBadgesCtrl
        $scope.setFilteredBadges = function(filteredBadges) {
            $scope.filteredBadges = filteredBadges;
        };

        $scope.clickBadgeAction = function(badge){
            $scope.setBadgeView(badge, keys.myProfile);
            $scope.goToViewBadge();
        };

        $scope.getBadges = function(callback){
            var childId = undefined;
            //We check if the user getting badges is the root user
            if(!isSameUser($rootScope.user, $scope.myProfile.user)){
                //The badges are for a users child
                childId =  $scope.myProfile.user._id;
            }

            dataService.getUsersBadges({childId: childId})
                .then(function(response){
                    if(response.data.badges){
                        if($scope.myProfile.user._id == response.data.ownerOfBadges){
                            //Only show the badges if the person the badges were requested for is the current user
                            //This is a precautionary measure if the request is slow to be answere for some reason.
                            $scope.badges = convertBadgesToClientBadges(response.data.badges);
                            if(callback){
                                callback();
                            } else {
                                $scope.filteredBadges = angular.copy($scope.badges);
                            }
                        }

                    }
                })
        };

        var convertBadgesToClientBadges = function(serverBadges){
            var ret = [];
            serverBadges.forEach(function(serverBadge){
                var convertedBadge = serverBadge.typeOfBadge;
                convertedBadge.received = serverBadge.received;
                ret.push(convertedBadge)
            });
            return ret;
        };

        var resetBadges = function(){
            $scope.badges = undefined;
            $scope.filteredBadges = undefined;
        };
    });