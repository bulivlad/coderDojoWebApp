/**
 * Created by catap_000 on 6/27/2017.
 */

angular.module("coderDojoTimisoara")
    .controller("addBadgesToUsersCtrl", function($scope, $rootScope, $location, dataService, helperSvc, $timeout){
        $scope.show = {
            showSelectedUsers: true,
            showSelectedBadges: true,
            showSelectUsers: false,
            showSelectBadges: false
        };

        $scope.selectedBadges = [];
        $scope.selectedUsers = [];
        $scope.addBadgesUsers = [];
        $scope.addBadgesFilteredUsers = [];
        $scope.communicationsPermitted = true;

        $scope.closeAddBadgeModal = function(){
            if($scope.isCtrlMemberCtrl()){
                $scope.closeAddBadgeModalFromMemberCtrl();
            }
        };

        //This is the method the viewBadgesCtrl will call when trying to get the badges to display them.
        $scope.getBadges = function(callback){
            dataService.getAllBadges()
                .then(function(response){
                    if(response.data.badges){
                        $scope.badges = response.data.badges;
                        if(callback){
                            callback();
                        }
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getBadges() addBadgesToUsersCtrl', $scope);
                })
        };

        $scope.clickBadgeAction = function(badge){
            $scope.selectedBadges.push(badge);
            addSelectedFlagToBadges(badge);
        };

        $scope.clickUserAction = function(user){
            $scope.selectedUsers.push(user);
            addSelectedFlagToUsers(user);
        };

        $scope.removeUserFromSelectedUsers = function(user){
            var indexOfUser = helperSvc.getIndexOfElementWithIdInArray($scope.selectedUsers, user);
            if(indexOfUser > -1){
                $scope.selectedUsers.splice(indexOfUser, 1);
            }
            removeSelectedFlagFromUsers(user);
        };

        $scope.removeBadgeFromSelectedBadges = function(badge){
            var indexOfBadge = helperSvc.getIndexOfElementWithIdInArray($scope.selectedBadges, badge);
            if(indexOfBadge > -1){
                $scope.selectedBadges.splice(indexOfBadge, 1);
            }
            removeSelectedFlagFromBadges(badge);
        };

        $scope.getBadgeHoverInfo = function(badge){
            return badge.name;
        };

        $scope.getUserHoverInfo = function(user){
            return 'Nume: ' + user.firstName + ' ' + user.lastName + '. ' +
                (user.email ? 'Email: ' + user.email + '. ': '') +
                (user.alias ? 'Alias: ' + user.alias + '. ': '');
        };

        $scope.getRemoveUserHoverInfo = function(user){
            return 'Șterge-l pe ' + user.firstName + ' ' + user.lastName;
        };

        var addSelectedFlagToUsers = function(user){
            addOrRemoveSelectedFlagToBadgesOrUsers(user, $scope.addBadgesUsers, $scope.addBadgesFilteredUsers, true);
        };

        var removeSelectedFlagFromUsers = function(user){
            addOrRemoveSelectedFlagToBadgesOrUsers(user, $scope.addBadgesUsers, $scope.addBadgesFilteredUsers, false);
        };

        var addSelectedFlagToBadges = function(badge){
            addOrRemoveSelectedFlagToBadgesOrUsers(badge, $scope.badges, $scope.filteredBadges, true);
        };

        var removeSelectedFlagFromBadges = function(badge){
            addOrRemoveSelectedFlagToBadgesOrUsers(badge, $scope.badges, $scope.filteredBadges, false);
        };

        $scope.getRemoveBadgeHoverInfo = function(badge){
            return 'Șterge ' + badge.name;
        };

        var addOrRemoveSelectedFlagToBadgesOrUsers  = function(badgeOrUser, badgesOrUsers, filteredBadgesOrUsers, ifAdd){
            for(var i = 0; i < badgesOrUsers.length; i++){
                if(badgeOrUser._id == badgesOrUsers[i]._id){
                    if(ifAdd){
                        badgesOrUsers[i].selected = true;
                    } else {
                        badgesOrUsers[i].selected = false;
                    }
                    break;
                }
            }
            for(var j = 0; j < filteredBadgesOrUsers.length; j++){
                if(badgeOrUser._id == filteredBadgesOrUsers[j]._id){
                    if(ifAdd){
                        filteredBadgesOrUsers[j].selected = true;
                    } else {
                        filteredBadgesOrUsers[j].selected = false;
                    }
                    break;
                }
            }
        };


        $scope.setFilteredBadges = function(filteredBadges){
            $scope.filteredBadges = filteredBadges;
        };



        $scope.getUserName = function(user){
            return user.firstName + ' ' + user.lastName;
        };

        var initializeFilteredUsers = function(){
            $scope.userFilterType = keys.filterUsersValues.nameDown;
        };

        var filterUsers = function(users){
            return helperSvc.filterUsers(users, $scope.addBadgesFilteredUsers, $scope.userFilterType, $scope.userFilterName.value);
        };

        $scope.selectUsersFilter = function(addBadgesUsersFilterType){
            //We set the filter type to the scope
            $scope.userFilterType = addBadgesUsersFilterType;
            //We filter the users and set them to the filtered users
            $scope.addBadgesFilteredUsers = filterUsers($scope.addBadgesUsers);
        };

        $scope.addBadgesToUsers = function(){
            if($scope.communicationsPermitted){
                if($scope.selectedBadges.length === 0){
                    $scope.setSnackBar('Nici un badge selectat', 'error');
                } else if ($scope.selectedUsers.length === 0){
                    $scope.setSnackBar('Nici un utilizator selectat', 'error');
                } else {
                    $scope.communicationsPermitted = false;
                    dataService.addBadgesToUsers({
                            dojoId: $scope.dojo._id,
                            users:$scope.selectedUsers,
                            badges: $scope.selectedBadges
                        })
                        .then(function(response){
                            if(response.data.errors === keys.notAuthorizedError){
                                $scope.showNotAuthorizedError();
                            } else if(response.data.success){
                                $scope.closeAddBadgeModal();
                                $scope.setSnackBar('Badge-uri adaugate', 'success');
                            }
                            $scope.communicationsPermitted = false;
                        })
                        .catch(function(err){
                            helperSvc.handlerCommunicationErrors(err, 'addBadgesToUsers addBadgesToUsersCtrl()', $scope);
                            $scope.communicationsPermitted = false;
                        })
                }
            }
        };

        var getUsersForMember = function(){
            dataService.getUsersForMember({typeOfUsers: keys.attendees, dojoId: $scope.dojo._id})
                .then(function(response){
                    if(response.data.errors === keys.notAuthorizedError){
                        $scope.showNotAuthorizedError();
                    } else {
                        $scope.addBadgesUsers = response.data.users;
                        initializeFilteredUsers();
                        $scope.addBadgesFilteredUsers = filterUsers($scope.addBadgesUsers);
                        if($scope.userToAddBadgeToFromMemberCtrl){
                            $scope.clickUserAction($scope.userToAddBadgeToFromMemberCtrl);
                            //After we set the user selected in the members ctrl, we reset him/her.
                            $scope.resetUserToAddBadge();
                        }
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getUsersForMember - memberCtrl', $scope);
                })
        };

        var initializeAddBadgesToUsersCtrl = function(){
            //To initialize this controller we need the users
            initializeFilteredUsers();
            getUsersForMember();

        };

        initializeAddBadgesToUsersCtrl();
    });