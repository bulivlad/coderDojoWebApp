/**
 * Created by Adina Paraschiv on 4/12/2017.
 */

angular.module("coderDojoTimisoara")
    .controller("memberCtrl", function($scope, $rootScope, $location, dataService, helperSvc){
        $scope.typeOfUser = 'Parinti';
        var getUsersForMember = function(typeOfUsers){
            dataService.getUsersForMember({typeOfUsers: typeOfUsers, dojoId: $scope.dojo._id})
                .then(function(response){
                    if(response.data.errors === keys.notAuthorizedError){
                        $scope.showNotAuthorizedError();
                    } else {
                        $scope.users = addNumbersToUser(response.data.users);
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getUsersForMember - memberCtrl', $scope);
                })
        };

        var addNumbersToUser = function(users){
            var count = 1;
            users.forEach(function(user){
                user.nrCrt = count++;
            });
            return users;
        }

        $scope.selectUserAction = function(){
            var typeOfUser = '';
            $scope.showAcceptReject = undefined;
            if($scope.typeOfUser === 'Parinti'){
                typeOfUser = 'parents';
            } else if($scope.typeOfUser === 'Copii'){
                typeOfUser = 'attendees';
            } else if($scope.typeOfUser === 'Mentori'){
                typeOfUser = 'mentors';
            }else if($scope.typeOfUser === 'Mentori in asteptare'){
                $scope.showAcceptReject = true;
                typeOfUser = 'pendingMentors';
            }else if($scope.typeOfUser === 'Voluntari'){
                typeOfUser = 'volunteers';
            }else if($scope.typeOfUser === 'Voluntari  in asteptare'){
                $scope.showAcceptReject = true;
                typeOfUser = 'pendingVolunteers';
            }else if($scope.typeOfUser === 'Campioni'){
                typeOfUser = 'champions';
            }else if($scope.typeOfUser === 'Campioni in asteptare'){
                $scope.showAcceptReject = true;
                typeOfUser = 'pendingChampions';
            }
            getUsersForMember(typeOfUser);
        };

        $scope.getUserInfoForExpandedLook = function(user){
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
                        for(var i = 0; i < $scope.users.length; i++){
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
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getUsersForMember - memberCtrl', $scope);
                })
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

        var initialize = function(){
            getUsersForMember('parents');
        };

        initialize();
    });