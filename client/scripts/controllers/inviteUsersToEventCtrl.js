/**
 * Created by catap_000 on 6/18/2017.
 */

angular.module("coderDojoTimisoara")
    .controller('inviteUsersToEventCtrl', function($scope, $rootScope, $location, $compile, dataService, helperSvc){
        $scope.invitesAlreadySent = [];
        $scope.sendInvitesTo = {all:true};
        $scope.communicationsPermitted = true;



        $scope.getUsersInvitedPreviously = function(invites){
            var ret = "";
            var nrOfInvitees = invites.length;
            if(nrOfInvitees === 1){
                ret = 'Au mai fost trimise invitații pentru ' + covertToRomanian(invites[0]) + '.'
            } else {
                ret = 'Au mai fost trimise invitații pentru: ';
                for(var i = 0; i < nrOfInvitees; i++){
                    if(i == 0){//For the first invitee
                        ret += covertToRomanian(invites[i]);
                    } else if(i === (nrOfInvitees - 1)){//For the last invitee
                        ret += ' și ' + covertToRomanian(invites[i]) + '.';
                    } else {
                        ret += ', ' + covertToRomanian(invites[i]);
                    }

                }
            }
            return ret;
        };

        var covertToRomanian = function(userRole){
            ret = 'cursanți';
            if(userRole === keys.mentor){
                ret = 'mentori';
            } else if(userRole === keys.volunteer){
                ret = 'voluntari';
            }  else if(userRole === keys.champion){
                ret = 'campioni';
            }  else if(userRole === keys.parent){
                ret = 'părinți';
            }
            return ret;
        };

        //Function that deals with all being selected
        $scope.selectAll = function(){
            //IF select all is chosen, we deselect the other choices as they are included
            if($scope.sendInvitesTo.all){
                $scope.sendInvitesTo = {all:true};
            }
        };

        $scope.selectOtherThanAll = function(){
            //IF some other than select all is chosen, we deselect all
            $scope.sendInvitesTo.all = false;
        };

        $scope.sendInvitations  = function(){
            if(!$scope.sendInvitesTo.attendees && !$scope.sendInvitesTo.mentors && !$scope.sendInvitesTo.volunteers &&
                !$scope.sendInvitesTo.parents && !$scope.sendInvitesTo.champions && !$scope.sendInvitesTo.all){
                alert('Nici un grup de utilizatori nu este selectat');
            } else {
                var sendInvitesTo = [];
                if($scope.sendInvitesTo.attendees){
                    sendInvitesTo.push(keys.attendee);
                } else if($scope.sendInvitesTo.mentors){
                    sendInvitesTo.push(keys.mentor);
                } else if($scope.sendInvitesTo.volunteers){
                    sendInvitesTo.push(keys.volunteer);
                } else if($scope.sendInvitesTo.champions){
                    sendInvitesTo.push(keys.champion);
                } else if($scope.sendInvitesTo.parents){
                    sendInvitesTo.push(keys.parent);
                } else if($scope.sendInvitesTo.all){
                    sendInvitesTo.push(keys.attendee);sendInvitesTo.push(keys.mentor);sendInvitesTo.push(keys.volunteer);
                    sendInvitesTo.push(keys.champion);sendInvitesTo.push(keys.parent);
                }

                var usersAlreadyInvited = determimeIfFromSelectedUsersSomeHaveBeenAlreadyInvited(sendInvitesTo, $scope.invitesAlreadySent);
                var continueWithSendingTheInvites = true;
                if(usersAlreadyInvited.length > 0){
                    var stringForConfirmAlert = $scope.getUsersInvitedPreviously(usersAlreadyInvited);
                    stringForConfirmAlert += ' Doriți să continuați?';
                    continueWithSendingTheInvites = confirm(stringForConfirmAlert);
                }

                if(continueWithSendingTheInvites){
                    dataService.sendInvitesToEvent({
                        eventId: $scope.event._id,
                        eventName: $scope.event.name,
                        dojoName: $scope.event.dojo.name,
                        dojoId: $scope.event.dojo._id,
                        sendInvitesTo: sendInvitesTo,
                        eventDate: $scope.event.eventDate
                    })
                        .then(function(response){
                            if(response.data.errors === keys.notAuthorizedError){
                                $scope.showNotAuthorizedError();
                            } else if (response.data.success){
                                $scope.hideInviteUsersPanel();
                                $scope.setUserInvitesSent();
                            }
                        })
                }
            }
        };

        var determimeIfFromSelectedUsersSomeHaveBeenAlreadyInvited  = function(sendInvitesTo, invitesAlreadySent){
            var ret = [];
            sendInvitesTo.forEach(function(invite){
                if(invitesAlreadySent.indexOf(invite) >= 0){
                    ret.push(invite);
                }
            });
            return ret;
        };

        var initializeInviteUsersToEventCtrl = function(){
            dataService.getUsersInvitedToEvent({eventId: $scope.event._id, dojoId: $scope.event.dojoId})
                .then(function(response){
                    if(response.data.errors === keys.notAuthorizedError){
                        $scope.showNotAuthorizedError();
                    } else if (response.data.invitesAlreadySent){
                        $scope.invitesAlreadySent = response.data.invitesAlreadySent;
                    }
                })
        };

        initializeInviteUsersToEventCtrl();



    });
