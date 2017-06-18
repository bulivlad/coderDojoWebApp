/**
 * Created by catap_000 on 5/23/2017.
 */


angular.module("coderDojoTimisoara")
    .controller('eventCtrl', function($scope, $rootScope, $location, $compile, dataService, helperSvc){
        $scope.event = {};
        $scope.views = {};
        $scope.communicationsPermitted = true;
        //Method for handling event promise. One the promise fulfills, we set the event as the current event, and
        // set the current view to viewEvent, and if there is a callback, we call it.
        var handleEvent = function(eventPromise, callback){
            eventPromise
                .then(function(response){
                    if(response.data.event){
                        $scope.event = prepareEventForDisplay(response.data.event);
                        $scope.setView(keys.viewEvent);
                        if(callback){
                            callback();
                        }
                    }else {
                        //If we were not answered with the event, go to view dojo
                        $scope.goToViewDojo();
                        $scope.setAlert(keys.infoAlert, 'Evenimentul nu mai este activ.');
                    }
                })

                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'eventCtrl handleEvent(eventPromise)', $scope);
                })
        };

        //Method for toggling the collapse of tickets
        $scope.toggleCollapseTickets = function(){
            if($scope.views[keys.collapseTickets]){
                $scope.views[keys.collapseTickets] = false;
                localStorage.removeItem(keys.collapseTickets);
            } else {
                $scope.views[keys.collapseTickets] = true;
                localStorage[keys.collapseTickets] = true;
            }
        };

        $scope.toggleViewFilterPanel = function(session){
            if(session[keys.viewFilterPanel]) {
                session[keys.viewFilterPanel] = false;
            } else {
                session[keys.viewFilterPanel] = true;
            }
        };

        $scope.showInviteUsersPanel = function(){
          $scope.views[keys.showInviteUsersPanel] = true;
        };

        $scope.hideInviteUsersPanel= function(){
            $scope.views[keys.showInviteUsersPanel] = false;
        };

        $scope.setUserInvitesSent = function(){
          $scope.views.userInvitesSend = true;
        };

        $scope.selectRegisteredUsersFilter = function(filter){
            //When name filter is selected
            if(filter === keys.filterRegisteredEventUsersValues.name) {
                //if name-down is the previous filter we set name-up as the current
                if($scope.views[keys.filterRegisteredEventUsers] === keys.filterRegisteredEventUsersValues.nameDown){
                    setFilterTypeForRegUsers(keys.filterRegisteredEventUsersValues.nameUp)
                } else {
                    //name-down is the default name filter
                    setFilterTypeForRegUsers(keys.filterRegisteredEventUsersValues.nameDown);
                }
            }
            //When role is selected
            else if(filter === keys.filterRegisteredEventUsersValues.role) {
                //if role-down is the previous filter we set role-up as the current
                if($scope.views[keys.filterRegisteredEventUsers] === keys.filterRegisteredEventUsersValues.roleDown){
                    setFilterTypeForRegUsers(keys.filterRegisteredEventUsersValues.roleUp)
                } else {
                    //role-down is the default role filter
                    setFilterTypeForRegUsers(keys.filterRegisteredEventUsersValues.roleDown)
                }
            }
            //When status is selected
            else if (filter === keys.filterRegisteredEventUsersValues.status){
                //if status-down is the previous filter we set status-up as the current
                if($scope.views[keys.filterRegisteredEventUsers] === keys.filterRegisteredEventUsersValues.statusDown){
                    setFilterTypeForRegUsers(keys.filterRegisteredEventUsersValues.statusUp);
                } else {
                    //status-down is the default status filter
                    setFilterTypeForRegUsers(keys.filterRegisteredEventUsersValues.statusDown)
                }
            } else {
                //This is the case when a particular filter is selected (when deleting the input for written name)
                setFilterTypeForRegUsers(filter);
            }
        };

        $scope.setView = function(view, extraShowFlags){
            $scope.views = {};
            $scope.views[view] = true;
            $scope.communicationsPermitted = true;
            if(extraShowFlags){
                extraShowFlags.forEach(function(flag){
                    $scope.views[flag] = true;
                })
            }
            if(view === keys.viewEvent){
                addFlagsFromLocalStorageForViewEvent();
            }
        };

        //MEthod that checks the local storage for flags and sets them to the viewEvent view.
        var addFlagsFromLocalStorageForViewEvent = function(){
            //We check for local stored info to add extra flags
            if(localStorage){
                //We check for the collapse tickets flag
                if(localStorage[keys.collapseTickets]){
                    $scope.views[keys.collapseTickets] = true;
                }
                //We check for the filter type
                var filterFromLocalStorage = localStorage[keys.filterRegisteredEventUsers];
                if(filterFromLocalStorage){
                    $scope.views[keys.filterRegisteredEventUsers] = filterFromLocalStorage;
                } else {
                    //If no value is stored for filter we default to name alphabetical (A-Z)
                    setFilterTypeForRegUsers(keys.filterRegisteredEventUsersValues.nameDown);
                }
            } else {
                //If there is no local storage we need to set the flag for filter by name alphabetical (A-Z)
                setFilterTypeForRegUsers(keys.filterRegisteredEventUsersValues.nameDown);
            }
        };

        var setFilterTypeForRegUsers = function(filterType){
            $scope.views[keys.filterRegisteredEventUsers] = filterType;
            filterAllSessions(filterType);
            if(localStorage){
                localStorage[keys.filterRegisteredEventUsers] = filterType;
            }
        };

        var getFilterTypeForRegUsers = function(){
            return $scope.views[keys.filterRegisteredEventUsers];
        };

        //We filter all the session based on the new filter set
        var filterAllSessions = function(filterType){
            $scope.event.sessions.forEach(function(session){
                session.filteredSessionRegUsers =  sortSessionUsers(session.sessionRegUsers, filterType);
            });
        };

        //Method for going back from the event view
        $scope.goBackAction = function(){
            if($scope.isCurrentView(keys.viewEvent)){
                var eventView = $scope.getEventView();
                //If the previous view was viewing a dojo
                if(eventView.previousLocation === keys.getDojoRoute){
                    $scope.goToViewDojo();
                } else if (eventView.previousLocation === keys.viewUserProfile){
                    $scope.goToViewUserProfile();
                } else {
                    $scope.goToDespre();
                }
            } else if($scope.isCurrentView(keys.editEvent)){
                $scope.initializeEvent();
            }
        };

        $scope.deleteEvent = function(){
            var confirmed = confirm('Esti sigur va vrei sa stergi evenimentul ' + $scope.event.name + ' de la dojo-ul ' +
                $scope.event.dojo.name + '?');
            if(confirmed){
                dataService.deleteEvent({eventId: $scope.event._id, dojoId: $scope.event.dojoId})
                    .then(function(response){
                        if(response.data.errors === keys.notAuthorizedError){
                            $scope.showNotAuthorizedError();
                        } else if(response.data.success){
                            $scope.goToViewDojo();
                        }
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err, 'deleteEvent() from addOrEditEventCtrl', $scope);
                    })
            }
        };

        $scope.editEventAction = function(){
          $scope.setView(keys.editEvent);
        };

        // Method to determine if the current view is thisView
        $scope.isCurrentView = function(thisView){
            return $scope.views[thisView];
        };

        //Method for constructing event fields needed when displaying the event
        var prepareEventForDisplay = function(event){
            event.eventName = helperSvc.getEventName(event);
            event.eventDate = helperSvc.getEventDate(event);
            event.sessions = helperSvc.convertEventTicketsToSessions(event.tickets);
            event.tickets = undefined;
            return event;
        };

        var getDojoInfoForEvent = function(){
            dataService.getDojo({dojoId: $scope.event.dojoId})
                .then(function(response){
                    if(response.data.dojo){
                        $scope.event.dojo = response.data.dojo;
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'eventCtrl - getDojoInfoForEvent()');
                })
        };

        //Method for registering for a ticket in a session of an event
        $scope.actOnTicket = function(ticketOption, ticket){
            //This flag is used to prohibit the spamming of the join and cancel buttons (you can only do an action if
            // another action has not been sent to the server as is being processed at the moment).
            if($scope.communicationsPermitted){
                //If the user is logged in
                if($scope.isUserLoggedIn()){
                    if(ticketOption.status === keys.eventStatus_NotRegistered){
                        registerUserForEvent(ticketOption, ticket);
                    } else  if(ticketOption.status === keys.eventStatus_Registered ||
                        ticketOption.status === keys.eventStatus_Confirmed){
                        removeUserFromEvent(ticketOption, ticket);
                    }
                } else {
                    //Alert informing the user to log in to register for event
                    $scope.setAlert(keys.childRegisterAlert);
                }
            }
        };

        var registerUserForEvent = function(ticketOption, ticket){
            //We do not allow further request for adding user until the current request has been resolved
            $scope.communicationsPermitted = false;
            dataService.registerUserForEvent({
                    userId: ticketOption.userId,
                    ticketId: ticket._id,
                    eventId: $scope.event._id,
                    dojoId: $scope.event.dojoId
                })
                .then(function(response){
                    if(response.data.errors == keys.wrongUserError){
                        $scope.setAlert(keys.infoAlert, 'Utilizatorul nu poate face această acțiune.');
                        $scope.communicationsPermitted = true;
                    } else if(response.data.errors == keys.userNoLongerPartOfDojo){
                        $scope.setAlert(keys.infoAlert, 'Utilizatorul nu mai face parte din dojo.');
                        $scope.communicationsPermitted = true;
                    }  else if(response.data.errors == keys.userAlreadyRegisteredForEventError){
                        $scope.setAlert(keys.infoAlert, 'Utilizatorul este de inregistrat la acest eveniment.');
                        $scope.communicationsPermitted = true;
                    } else if(response.data.success){
                        $scope.initializeEvent();
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'registerUserForEvent', $scope);
                    $scope.communicationsPermitted = true;
                })
        };

        var removeUserFromEvent = function(ticketOption, ticket){
            //We do not allow further request for adding user until the current request has been resolved
            $scope.communicationsPermitted = false;
            dataService.removeUserFromEvent({
                    userId: ticketOption.userId,
                    ticketId: ticket._id,
                    eventId: $scope.event._id,
                })
                .then(function(response){
                    if(response.data.errors == keys.wrongUserError){
                        $scope.setAlert(keys.infoAlert, 'Utilizatorul nu poate face această acțiune.');
                        $scope.communicationsPermitted = true;
                    } else if(response.data.success){
                        $scope.initializeEvent();
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'removeUserFromEvent', $scope);
                    $scope.communicationsPermitted = true;
                })
        };

        $scope.getTicketOptionButtonName = function(ticketOption){
            if(ticketOption.status === keys.eventStatus_NotRegistered ||
                ticketOption.status === keys.eventStatus_userNotLoggedIn){
                return 'Înscrie';
            } else  if(ticketOption.status === keys.eventStatus_Registered ||
                ticketOption.status === keys.eventStatus_Confirmed){
                return 'Renunță';
            }
        };


        $scope.toggleViewUsers = function(session){
            //First we check if the user wants to close the panel for viewing event users
            if(!session.viewUsers){
                if($scope.communicationsPermitted){
                    getRegisteredUsersForEvent(session);
                }
            } else {
                //We close the panel
                session.viewUsers = false;
            }

        };

        var getRegisteredUsersForEvent = function(session){
            dataService.getUsersRegisteredForEvent({eventId:$scope.event._id, dojoId: $scope.event.dojoId})
                .then(function(response){
                    if(response.data.errors === keys.notAuthorizedError){
                        $scope.showNotAuthorizedError();
                        $scope.communicationsPermitted = true;
                    } else if(response.data.usersRegForEvent){
                        //The data received from the server is separated into tickets (we need to separate it by sessions)
                        var usersBySession = helperSvc.convertEventTicketsToSessions(response.data.usersRegForEvent.tickets);
                        //Now we have to add the users to each session to be displayed
                        addViewUsersToCurrentEvent(usersBySession);
                        $scope.communicationsPermitted = true;
                        //Set the flag to open the user viewing panel
                        session.viewUsers = true;
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getRegisteredUsersForEvent()', $scope);
                    $scope.communicationsPermitted = true;
                });
        };

        //Method that adds the users registered to the event to the event sessions
        var addViewUsersToCurrentEvent = function(sessionsWithRegUsers){
            //We iterate through the $scope sessions
            $scope.event.sessions.forEach(function(session){
                //We need to empty the sessionRegUsers because subsequent request would fill it with doubles
                session.sessionRegUsers = [];
                for(var i = 0; i< sessionsWithRegUsers.length; i++){
                    //For each $scope session with iterate through the received sessions
                    var sessionWithRegUsers = sessionsWithRegUsers[i];
                    //IF the _ids match
                    if(session._id === sessionWithRegUsers._id){
                        //We add all the registered members from all the tickets of the received session
                        for(var j = 0; j < sessionWithRegUsers.tickets.length; j++){
                            var ticket = sessionWithRegUsers.tickets[j];
                            //We add all the registered members and the name of the ticket from the ticket object
                            ticket.registeredMembers.forEach(function(regMember){
                                regMember.nameOfTicket = ticket.nameOfTicket;
                                regMember.ticketId = ticket._id;
                                session.sessionRegUsers.push(regMember);
                            });
                        }
                        //After adding all the registered members from the session we break
                        break;
                    }
                }
                //After we add all the registered users for the current session we make a clone for the filtered session
                //IF the session filter has something in the input, we must filter according to it
                if(session.filterName){
                    $scope.filterUsersBasedOnInput(session);
                } else {
                    session.filteredSessionRegUsers = sortSessionUsers(session.sessionRegUsers, getFilterTypeForRegUsers());
                }
            })
        };

        //Method that returns a filtered(or sorted) array
        // the session argument is used only for filtering one session for name written
        var sortSessionUsers = function(sessionRegUsers, filterType){
            var ret = [];
            ret = angular.copy(sessionRegUsers);
            var functionToSort;
            if(filterType === keys.filterRegisteredEventUsersValues.nameUp){
                functionToSort = helperSvc.sortNameDesc;
            } else if(filterType === keys.filterRegisteredEventUsersValues.nameDown){
                functionToSort = helperSvc.sortNameAsc;
            } else if(filterType === keys.filterRegisteredEventUsersValues.statusUp){
                functionToSort = helperSvc.sortEventStatusDesc;
            } else if(filterType === keys.filterRegisteredEventUsersValues.statusDown){
                functionToSort = helperSvc.sortEventStatusAsc;
            } else if(filterType === keys.filterRegisteredEventUsersValues.roleUp){
                functionToSort = helperSvc.sortEventRoleDesc;
            } else if(filterType === keys.filterRegisteredEventUsersValues.roleDown){
                functionToSort = helperSvc.sortEventRoleAsc;
            }
            ret.sort(functionToSort);
            return ret;
        };

        //Method for filtering users based on the input field
        $scope.filterUsersBasedOnInput = function(session){
            var filteredSessionRegUsers = filterUsersBasedOnInput(session);
            if(filteredSessionRegUsers){
                session.filteredSessionRegUsers = filteredSessionRegUsers;
            } else {
                //If false was returned we filter (sort) based on the global sort
                session.filteredSessionRegUsers = sortSessionUsers(session.sessionRegUsers, getFilterTypeForRegUsers());
            }
        };

        //Method that filters the users array using the input the user provided.
        var filterUsersBasedOnInput = function(session){
            var ret = [];
            var sessionRegUsers = session.sessionRegUsers;
            var filterName = session.filterName;
            if(filterName){
                var splitFilteredNames = filterName.split(' ');
                var name1, name2;
                if(splitFilteredNames.length === 1){
                    name1 = helperSvc.addDiacriticsToSearch(splitFilteredNames[0]);
                } else if (splitFilteredNames.length > 1){
                    name1 = helperSvc.addDiacriticsToSearch(splitFilteredNames[0]);
                    name2 = helperSvc.addDiacriticsToSearch(splitFilteredNames[1]);
                }

                //If there is nothing in the input field we clone the original array as we should display all users
                if (!name1 && !name2){
                    ret = angular.copy(sessionRegUsers);
                } else {
                    if(name1 && name2){
                        let regExName1 = new RegExp(name1, 'i');
                        let regExName2 = new RegExp(name2, 'i');
                        for(var i = 0; i < sessionRegUsers.length; i++){
                            var regUser = sessionRegUsers[i];
                            if((regUser.firstName.match(regExName1) && regUser.lastName.match(regExName2)) ||
                                (regUser.firstName.match(regExName2) && regUser.lastName.match(regExName1)) ||
                                (regUser.firstName.match(regExName1) && regUser.lastName.match(regExName1)) ||
                                (regUser.firstName.match(regExName2) && regUser.lastName.match(regExName2))){
                                ret.push(regUser);
                            }
                        }
                    } else {
                        // there is only one word to filter by
                        let regExName1 = new RegExp(name1, 'i');
                        for(var i = 0; i < sessionRegUsers.length; i++) {
                            var regUser = sessionRegUsers[i];
                            if(regUser.firstName.match(regExName1) || regUser.lastName.match(regExName1)){
                                ret.push(regUser);
                            }
                        }
                    }
                }
            } else {
                //If the filtered name is not yet filled, return false
                return false;
            }

            //After filtering for the name, we sort A-Z
            ret.sort(helperSvc.sortNameAsc);
            return ret;
        };

        $scope.confirmOrRemoveUserFromEvent = function(regUser, whichAction){
            if($scope.communicationsPermitted){
                var data = {
                    dojoId: $scope.event.dojoId,
                    eventId: $scope.event._id,
                    whichAction: whichAction,
                    userToAddOrRemoveId: regUser.userId,
                    regUserId: regUser._id,
                    ticketId: regUser.ticketId,
                    dojoName: $scope.event.dojo.name
                };
                if(whichAction === keys.eventRemoveUser){
                    //If the user is attempting to remove the user, we prompt for confirmation
                    var confirmed  = confirm('Sigur vrei să il scoți pe ' + regUser.firstName + ' ' +
                            regUser.lastName +  ' de la eveniment?');
                    if(!confirmed){
                        return;
                    }
                }
                //Block communication until a message is received
                $scope.communicationsPermitted = false;
                dataService.confirmOrRemoveUserFromEvent(data)
                    .then(function(response){
                        if(response.data.errors === keys.notAuthorizedError){
                            $scope.showNotAuthorizedError();
                            $scope.communicationsPermitted = true;
                        } else if(response.data.usersRegForEvent){
                            //The data received from the server is separated into tickets (we need to separate it by sessions)
                            var usersBySession = helperSvc.convertEventTicketsToSessions(response.data.usersRegForEvent.tickets);
                            //Now we have to add the users to each session to be displayed
                            addViewUsersToCurrentEvent(usersBySession);
                            $scope.communicationsPermitted = true;
                        }
                        $scope.communicationsPermitted = true;
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err, 'confirmOrRemoveUserFromEvent()', $scope);
                        $scope.communicationsPermitted = true;
                    })
            }
        };

        $scope.initializeEvent = function(){
            var eventView = $scope.getEventView();
            //An event view object must exist for us to know which event to display
            if(eventView){
                if($scope.isUserLoggedIn()){
                    //If the call for the event is fulfilled we send a callback to request info about the dojo (location
                    // and name of dojo)
                    handleEvent(dataService.getAuthEvent({eventId: eventView.eventId}), getDojoInfoForEvent);
                } else {
                    handleEvent(dataService.getEvent({eventId: eventView.eventId}), getDojoInfoForEvent);

                }
            } else {
                //An error has occurred, go to view despre
                $scope.goToDespre();
            }
        };



        $scope.initializeEvent();
    });