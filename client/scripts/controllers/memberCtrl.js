/**
 * Created by Adina Paraschiv on 4/12/2017.
 */

angular.module("coderDojoTimisoara")
    .controller("memberCtrl", function($scope, $rootScope, $location, dataService, helperSvc){
        $scope.userFilterName = {};
        $scope.openFilterMenu = false;
        $scope.show = {};
        var getUsersForMember = function(typeOfUsers){
            dataService.getUsersForMember({typeOfUsers: typeOfUsers, dojoId: $scope.dojo._id})
                .then(function(response){
                    if(response.data.errors === keys.notAuthorizedError){
                        $scope.showNotAuthorizedError();
                    } else {
                        $scope.users = response.data.users;
                        $scope.filteredUsers = filterUsers($scope.users);
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getUsersForMember - memberCtrl', $scope);
                })
        };

        $scope.showAddBadge = function(){
            return $scope.typeOfUser === keys.memberType.attendees;
        };

        $scope.expandContractUser = function(memberUser){
            if(memberUser.expand){
                memberUser.expand = false;
            } else {
                getUserInfoForExpandedLook(memberUser, function(memberUser){
                    memberUser.expand = true;
                })
            }
        };

        //Method that is called when selecting a filter.
        $scope.selectUsersFilter = function(filterType){
            setFilteredUserType(filterType);
            $scope.filteredUsers = filterUsers($scope.users);
        };

        //Method that sets the filter type in the scope for use when filtering users
        var setFilteredUserType = function(filterType){
            if(filterType === keys.filterUsersValues.name){
                if($scope.filterType == keys.filterUsersValues.nameUp){
                    $scope.filterType = keys.filterUsersValues.nameDown;
                } else {
                    $scope.filterType = keys.filterUsersValues.nameUp;
                }
            } else if (filterType === keys.filterUsersValues.nameWritten) {
                $scope.filterType = keys.filterUsersValues.nameWritten;
            }
        };


        var filterUsers = function(users){
            return helperSvc.filterUsers(users, $scope.filteredUsers, $scope.filterType, $scope.userFilterName.value);
        };



        $scope.toggleFilterMenu = function(){
            if($scope.views.openFilterMenu) {
                $scope.views.openFilterMenu = false;
            }else {
                $scope.views.openFilterMenu = true;
            }
        };

        var convertUsersSelectFromEnglishToRomanian = function(userInEnglish){
           return keys.memberType[userInEnglish];
        };

        $scope.selectUserAction = function(){
            var typeOfUser = '';
            $scope.showAcceptReject = undefined;
            if($scope.typeOfUser === keys.memberType.parents){
                typeOfUser = keys.parents;
            } else if($scope.typeOfUser === keys.memberType.attendees){
                typeOfUser = keys.attendees;
            } else if($scope.typeOfUser === keys.memberType.mentors){
                typeOfUser = keys.mentors;
            }else if($scope.typeOfUser === keys.memberType.pendingMentors){
                $scope.showAcceptReject = true;
                typeOfUser = keys.pendingMentors;
            }else if($scope.typeOfUser === keys.memberType.volunteers){
                typeOfUser = keys.volunteers;
            }else if($scope.typeOfUser === keys.memberType.pendingVolunteers){
                $scope.showAcceptReject = true;
                typeOfUser = keys.pendingVolunteers;
            }else if($scope.typeOfUser === keys.memberType.champions){
                typeOfUser = keys.champions;
            }else if($scope.typeOfUser === keys.memberType.pendingChampions){
                $scope.showAcceptReject = true;
                typeOfUser = keys.pendingChampions;
            }
            setStoredTypeOfUsers(typeOfUser);
            getUsersForMember(typeOfUser);
        };

        var getUserInfoForExpandedLook = function(user, callback){
            dataService.getDetailedUserForMember({userId: user._id, dojoId: $scope.dojo._id})
                .then(function(response){
                    if(response.data.errors === keys.notAuthorizedError){
                        $scope.showNotAuthorizedError();
                    } else if (response.data.errors === keys.userNoLongerPartOfDojo){
                        //If the user is no longer part of the dojo, we get a warning and refresh the users list
                        $scope.selectUserAction();
                        $scope.setAlert(keys.infoAlert, 'Utilizatorul nu mai face parte din dojo!');
                    } else {
                        var detailedUser = response.data.user;
                        //We search for the user received from the server in the current list of simplified users,
                        // and replace the current user with the one received from the server (which has all of the info).
                        addDetailedInfoToUser(detailedUser);
                        if(callback){
                            callback(user);
                        }
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getUsersForMember - memberCtrl', $scope);
                })
        };

        var addDetailedInfoToUser = function(detailedUser){
            for(var i = 0; i < $scope.users.length; i++){
                //we add the fields instead of replacing the whole user becasuse of the way ng-repeat works
                if($scope.users[i]._id === detailedUser._id){
                    $scope.users[i].phone = detailedUser.phone;
                    $scope.users[i].email = detailedUser.email;
                    $scope.users[i].alias = detailedUser.alias;
                    $scope.users[i].facebook = detailedUser.facebook;
                    $scope.users[i].linkedin = detailedUser.linkedin;
                    $scope.users[i].languagesSpoken = detailedUser.languagesSpoken;
                    $scope.users[i].programmingLanguages = detailedUser.programmingLanguages;
                    $scope.users[i].biography = detailedUser.biography;
                    $scope.users[i].gender = detailedUser.gender;
                    $scope.users[i].address = detailedUser.address;
                    $scope.users[i].birthDate = $scope.getPrettyDate(detailedUser.birthDate);
                    break;
                }
            }

            for(var i = 0; i < $scope.filteredUsers.length; i++){
                if($scope.filteredUsers[i]._id === detailedUser._id){
                    $scope.filteredUsers[i].phone = detailedUser.phone;
                    $scope.filteredUsers[i].email = detailedUser.email;
                    $scope.filteredUsers[i].alias = detailedUser.alias;
                    $scope.filteredUsers[i].facebook = detailedUser.facebook;
                    $scope.filteredUsers[i].linkedin = detailedUser.linkedin;
                    $scope.filteredUsers[i].languagesSpoken = detailedUser.languagesSpoken;
                    $scope.filteredUsers[i].programmingLanguages = detailedUser.programmingLanguages;
                    $scope.filteredUsers[i].biography = detailedUser.biography;
                    $scope.filteredUsers[i].gender = detailedUser.gender;
                    $scope.filteredUsers[i].address = detailedUser.address;
                    $scope.filteredUsers[i].birthDate = $scope.getPrettyDate(detailedUser.birthDate);
                    break;
                }
            }
        };

        //Method for accepting a pending member in a dojo (for mentor, volunteer, champion)
        $scope.acceptPendingMemberForDojo = function(user){
            dataService.acceptPendingMemberForDojo({userId: user._id, dojoId: $scope.dojo._id})
                .then(function(response){
                    if(response.data.errors === keys.notAuthorizedError){
                        $scope.showNotAuthorizedError();
                    } else if (response.data.success){
                        $scope.selectUserAction();
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getUsersForMember - memberCtrl', $scope);
                })
        };

        //method for rejecting a pending members for a dojo (for mentor, volunteer, champion)
        $scope.rejectPendingMemberForDojo = function(user){
            var confirmed  = confirm('Sigur vrei sa stergi aplicatia lui ' + user.firstName + ' ' + user.lastName + '?');
            if (confirmed){
                dataService.rejectPendingMemberForDojo({userId: user._id, dojoId: $scope.dojo._id})
                    .then(function(response){
                        if(response.data.errors === keys.notAuthorizedError){
                            $scope.showNotAuthorizedError();
                        } else if (response.data.success){
                            $scope.selectUserAction();
                        }
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err, 'getUsersForMember - memberCtrl', $scope);
                    })
            }
        };

        //This method store the user group the user wants to see
        var setStoredTypeOfUsers = function(typeOfUsers){
            //Only save members that are not pending, baucause not every user has access to pending members
            if(typeOfUsers != keys.pendingChampions && typeOfUsers != keys.pendingMentors &&
                typeOfUsers != keys.pendingVolunteers){
                if(localStorage){
                    localStorage[keys.storedTypeOfUsers] = typeOfUsers;
                }
            }

        };

        var getStoredTypeOfUsers = function(){
            if(localStorage){
                if (localStorage[keys.storedTypeOfUsers]) {
                    return localStorage[keys.storedTypeOfUsers];
                } else {
                    return keys.attendees;
                }
            } else {
                return keys.attendees;
            }
        };

        //This method is used to inform children controllers of the parent controller
        $scope.isCtrlMemberCtrl = function(){
          return true;
        };

        //THis method is used to close the add badge modal. THis method is used from the
        // addBadgesCtrl
        $scope.closeAddBadgeModalFromMemberCtrl = function(){
            $scope.show[keys.openAddBadgeMenu] = false;
            //We need to show scroll for body as it was removed when opening the add badge modal
            $scope.showScrollForBody();
        };


        $scope.resetUserToAddBadge = function(){
            $scope.userToAddBadgeToFromMemberCtrl = undefined;
        };

        $scope.addBadgeAction = function(user){
            if(user){
                $scope.userToAddBadgeToFromMemberCtrl = user;
                $scope.show[keys.openAddBadgeMenu] = true;
            } else {
                $scope.show[keys.openAddBadgeMenu] = true;
            }
            $scope.hideScrollForBody();
        };

        var initialize = function(){
            var typeOfUsers = getStoredTypeOfUsers();
            $scope.typeOfUser = convertUsersSelectFromEnglishToRomanian(typeOfUsers);
            getUsersForMember(typeOfUsers);
        };

        initialize();
    });