/**
 * Created by Adina Paraschiv on 4/25/2017.
 */

angular.module("coderDojoTimisoara")
    .controller('dojoCtrl', function($scope, $rootScope, $location, $compile, dataService, helperSvc){
        $scope.dojo = {};
        $scope.views = {};

        //Method for getting a dojo for an Un-authenticated user
        $scope.getDojoFromServerAndMakeMap = function(dojoId){
            dataService.getDojo({dojoId: dojoId})
                .then(function(response){
                    if (response.data.dojo){
                        $scope.dojo = response.data.dojo;
                        createMapWithDojo($scope.dojo, 'dojo-map-single-dojo');
                        getCurrentDojoEvents();
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getDojoFromServerAndMakeMap - dojoCtrl', $scope);
                })

        };

        //Method for getting a dojo for an Authenticated user
        $scope.getAuthDojoFromServerAndMakeMap = function(dojoId){
            dataService.getAuthDojo({dojoId: dojoId})
                .then(function(response){
                    if (response.data.dojo){
                        $scope.dojo = response.data.dojo;
                        createMapWithDojo($scope.dojo, 'dojo-map-single-dojo');
                        getAuthCurrentDojoEvents();
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getDojoFromServerAndMakeMap - dojoCtrl', $scope);
                })
        };

        $scope.setView = function(view, extraShowFlags){
            $scope.views = {};
            $scope.views[view] = true;
            if(extraShowFlags){
                extraShowFlags.forEach(function(flag){
                    $scope.views[flag] = true;
                })
            }
        };

        //Method for navigating back in the dojo view
        $scope.goBackAction = function(){
            if($scope.isCurrentView(keys.viewDojo)){
                goToDojoSelector();
            } else if($scope.isCurrentView(keys.viewMembers) || // if Viewing members
                $scope.isCurrentView(keys.editDojo)){     // or editing dojos
                $scope.setView(keys.viewDojo, [keys.showBackButton]);
                createMapWithSingleDojo();
            } else if($scope.isCurrentView(keys.addEventToDojo)){
                $scope.initializeDojoCtrl();
            }

        };

        var goToDojoSelector = function(){
            var dojoSelector = $scope.getDojoSelector();
            if(dojoSelector === keys.getMyDojosRoute){
                $location.path('/' + keys.getMyDojosRoute);
                $scope.goToMyDojos();
            } else if(dojoSelector === keys.myProfile){
                $scope.goToViewUserProfile();
            } else {
                $location.path('/' + keys.cautaUnDojo);
            }
        };

        //Method for determining the users role in the dojo
        $scope.getUserRoleInDojo = function(){
            if($scope.dojo.mentor){
                return 'Mentor';
            } else if($scope.dojo.attendee){
                return 'Elev';
            } else if($scope.dojo.parent){
                return 'Parinte';
            } else  if($scope.dojo.champion){
                return 'Campion';
            } else  if($scope.dojo.volunteer){
                return 'Voluntar';
            } else  if($scope.dojo.pendingMentor){
                return 'Mentor in asteptare';
            }else  if($scope.dojo.pendingVolunteer){
                return 'Voluntar in asteptare';
            } else  if($scope.dojo.pendingChampion){
                return 'Campion in asteptare';
            } else if($scope.dojo.admin){
                return 'Administator';
            } else {
                return '-';
            }
        };

        //Method for deleting a dojo
        $scope.deleteDojo = function(){
            var confirmed  = confirm('Sigur vrei sa stergi dojo-ul ' + $scope.dojo.name + '?');
            if(confirmed) {
                confirmed = confirm('Esti foarte sigur ca vrei sa stergi dojo-ul ' + $scope.dojo.name + '?');
                if (confirmed) {
                    dataService.deleteDojo({dojoId: $scope.dojo._id})
                        .then(function (response) {
                            if (response.data.success) {
                                goToDojoSelector();
                            } else if (response.data.errors === keys.notAuthorizedError) {
                                $scope.showNotAuthorizedError();
                            }

                        })
                        .catch(function (err) {
                            helperSvc.handlerCommunicationErrors(err, 'deleteDojo', $scope);
                        });
                }
            }
        };

        $scope.addEventAction = function(){
          $scope.setView(keys.addEventToDojo);
        };

        //Method for goin into edit dojo mode
        $scope.goToEditDojo = function(){
            $scope.setView(keys.editDojo);
        };

        // Method to determine if the current view is thisView
        $scope.isCurrentView = function(thisView){
            return $scope.views[thisView];
        };

        //Method for getting the event date
        $scope.getEventDate = function(event){
            return helperSvc.getEventDate(event);
        };

        //Method for informing the GUI to show user not registered for event
        $scope.showUserNotRegistered = function(dojoEvent){
            if($scope.isUserLoggedIn()){
                if(!(dojoEvent.regUsers && dojoEvent.regUsers.length > 0)){
                    return true;
                }
            }
        };

        $scope.getRegisterButtonLabel = function(dojoEvent){
            var ret = 'Rezervă';
            if($scope.isUserLoggedIn()){
                if((dojoEvent.regUsers && dojoEvent.regUsers.length > 0)){
                    ret = 'Editează';
                }
            }
            return ret;
        };

        //Method for getting the dojo name to display
        $scope.getDojoName = function(event){
            var ret = '';
            //This is a weekly event
            if(event.copyOfRecurrentEvent){
                ret = 'Sesiuni săptămânale la ' + $scope.dojo.name;
            } else {
                ret = event.name + ' la ' + $scope.dojo.name;
            }
            return ret;
        };

        $scope.createSchedule = function(rawSchedule){
            var ret = '';

            if(rawSchedule){
                var startHour = helperSvc.adjustOneNumberMinutes(rawSchedule.startHour + '');

                var endHour =  helperSvc.adjustOneNumberMinutes(rawSchedule.endHour + '');

                var startMinute = helperSvc.adjustOneNumberMinutes(rawSchedule.startMinute + '');

                var endMinute = helperSvc.adjustOneNumberMinutes(rawSchedule.endMinute + '');

                var schedule = 'In fiecare ' +  rawSchedule.day + ' de la ' + startHour + ':' + startMinute +
                    ' la ' + endHour + ':' + endMinute;

                ret += schedule;
            }

            return ret;
        };

        //Method for sending request to server to become a member of a dojo
        $scope.becomeMemberOfDojo = function($event, whatMember){
            $event.stopPropagation();
            var currentDojoId = $scope.dojo._id;
            dataService.becomeMemberOfDojo({dojoId: currentDojoId, whatMember: whatMember})
                .then(function(response){
                    if(response.data.success){
                        //If the request for membership has been sent successfully, we refresh the dojos
                        // from the server (with the current user joined or pending)
                        dataService.getAuthDojo({dojoId: currentDojoId})
                            .then(function(response){
                                if(response.data.dojo){
                                    $scope.dojo = response.data.dojo;
                                }
                                $scope.closeJoinModal();
                            })
                            .catch(function(err){
                                $scope.closeJoinModal();
                                goToDojoSelector();
                                console.log(err);
                            })
                    } else {
                        $scope.closeJoinModal();
                        if(response.data.errors === keys.userAlreadyJoinedDojoError){
                            $scope.setAlert(keys.infoAlert, 'Utilizatorul deja face parte din dojo.');
                        } else {
                            $scope.setAlert(keys.errorAlert, 'Probleme de comunicare cu serverul, te rugăm să mai încerci.');
                        }

                    }

                })
                .catch(function(err){
                    if(err.status === 500){
                        $scope.setAlert(keys.errorAlert, 'Probleme de comunicare cu serverul, te rugăm să mai încerci.');
                    } else if (err.status === 401){
                        $scope.setAlert(keys.errorAlert, 'Nu esti autorizat pentru aceasta operatiune!');
                    }

                    $scope.closeJoinModal();

                })

        };

        $scope.goToViewMembers = function(){
            $scope.setView(keys.viewMembers, [keys.showBackButton]);
        };

        //method for joining dojo
        $scope.joinDojoAction = function(){
            if($scope.isUserLoggedIn()){
                $('body').css('overflow', 'hidden');
                $scope.views.showJoin = true;
                if(helperSvc.isAgeGreaterThen18($scope.user.birthDate)){
                    $scope.views.isAdult = true;
                }
            } else {
                $scope.goToLogin();
            }
        };

        //Method for leaving dojo
        $scope.leaveDojoAction = function(){
            var currentDojoId = $scope.dojo._id;
            dataService.leaveDojo({dojoId: currentDojoId})
                .then(function(response){
                    if(response.data.success){
                        //If the leaving of the dojo has been successful, we reload the dojos and set the current
                        // dojo as the loaded dojo
                        dataService.getAuthDojo({dojoId: currentDojoId})
                            .then(function(response){
                                if(response.data.dojo){
                                    $scope.dojo = response.data.dojo;
                                }
                            })
                            .catch(function(err){
                                goToDojoSelector();
                                console.log(err);
                            })
                    }
                })
        };

        $scope.closeJoinModal = function(){
            $scope.views.showJoin = false;
            $('body').css('overflow', 'auto');
        };


        var createMapWithDojo = function(dojo, elementName){
            setTimeout(function(){
                drawMap(dojo, elementName);
            }, 300)
        };


        //Method for injecting a google maps plugin for displaying a dojo. Element name is the element where we are
        //going to inject the map (it's id).
        var drawMap = function(dojo, elementName){
            var latLongDojo = new google.maps.LatLng(dojo.latitude, dojo.longitude);

            $scope.mapProp = {
                center: latLongDojo,
                zoom: 12,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            mapObj = new google.maps.Map(document.getElementById(elementName), $scope.mapProp);

            //Creating markers
            var markerLatLng =  latLongDojo;
            var marker = new google.maps.Marker({
                position: markerLatLng,
                map: mapObj,
                name:dojo.name
            });

        };

        var createMapWithSingleDojo = function(){
            setTimeout(function(){
                createMapWithDojo($scope.dojo, 'dojo-map-single-dojo');

            }, 200);
        };

        var getCurrentDojoEvents = function(){
            dataService.getCurrentDojoEvents({dojoId: $scope.dojo._id})
                .then(function(response){
                    if(response.data.events){
                        $scope.dojo.events = prepareDojoEvents(response.data.events);
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getCurrentDojoEvents', $scope);
                })
        };

        var getAuthCurrentDojoEvents = function(){
            dataService.getAuthCurrentDojoEvents({dojoId: $scope.dojo._id})
                .then(function(response){
                    if(response.data.events){
                        $scope.dojo.events = prepareDojoEvents(response.data.events);
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getAuthCurrentDojoEvents', $scope);
                 })
        };

        //Prepare the events for display
        var prepareDojoEvents = function(events){
            //We need to convert the ticket based to session based
            events.forEach(function(event){
                event.sessions = helperSvc.convertEventTicketsToSessions(event.tickets);
                event.tickets = undefined;
            });
            return events;
        };

        $scope.viewEventAction = function(event){
          $scope.setEventView(event._id, keys.getDojoRoute);
          $scope.goToViewEvent();
        };

        $scope.getRegUserInfo = function(regUser){
            return regUser.name + ' este ' + (regUser.status ? 'confirmat' : 'înregistrat')  + ' ca ' + regUser.nameOfTicket +
                    ' la eveniment.'
        };

        $scope.initializeDojoCtrl = function(){
            var toBeViewedDojoId = $scope.getToBeViewedDojoId();
            //We check the a dojo to be viewed has been set in another view (it should have been, otherwise an error
            // has occurred, and we go to the search dojos page
            if(toBeViewedDojoId){
                $scope.setView(keys.viewDojo, [keys.showBackButton]);
                if($scope.isUserLoggedIn()){
                    $scope.getAuthDojoFromServerAndMakeMap(toBeViewedDojoId);
                    //getAuthCurrentDojoEvents();
                } else {
                    $scope.getDojoFromServerAndMakeMap(toBeViewedDojoId);
                }

            } else {
                $location.path('/' + keys.cautaUnDojo);
            }
        };

        $scope.initializeDojoCtrl();
    });
