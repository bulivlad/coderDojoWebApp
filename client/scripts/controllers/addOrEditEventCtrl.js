/**
 * Created by catap_000 on 6/11/2017.
 */
angular.module("coderDojoTimisoara")
    .controller('addOrEditEventCtrl', function($scope, $rootScope, $location, dataService, helperSvc){

        var createDates = function(){
            $( function() {
                $( ".start-hour-unique-event" ).datepicker({
                    changeMonth: true,
                    changeYear: true,
                    //minDate: "0",
                    //yearRange: "0:+1",
                    dayNamesMin:keys.daysOfWeekShort,
                    monthNamesShort:keys.months
                });
            } );
        };

        $scope.addSession = function(sessions){
            sessions.push({
                tickets:[{}],
                _id : helperSvc.generateSessionId()
            });
        };

        //Creating the date selecting interface we use jquery. Unfortunately the Html object does not exist when
        // the controller loads so we need to offset the creation of the datepicker.
        setTimeout(function(){
            createDates();
        }, 1000);


        $scope.getAddOrEditButton = function(){
            if($scope.isCurrentView(keys.editEvent)){
                return 'Editează evenimentul';
            } else if($scope.isCurrentView(keys.addEventToDojo)){
                return 'Adaugă evenimentul';
            }
        };

        $scope.editOrCreateEventAction = function(){
            if($scope.isCurrentView(keys.editEvent)){
                editEvent();
            } else if($scope.isCurrentView(keys.addEventToDojo)){
                createEvent();
            }
        };

        var deserializeDayForEvent = function(event){
            event.day = new Date(event.day);
        };

        var createEvent = function(){
            var errors = helperSvc.validateEventFields([$scope.localEvent]);
            if(!errors){
                var preparedEvent = helperSvc.removeSanitizedFlagsAndErrorsFromEvent($scope.localEvent);
                dataService.addEventToDojo({dojoId: $scope.dojo._id, event:preparedEvent})
                    .then(function(response){
                        if(response.data.errors === keys.notAuthorizedError){
                            $scope.showNotAuthorizedError();
                        } else if(response.data.errors === keys.notSanitizedError){
                            var sanitizedEvent = response.data.sanitizedEvent;
                            helperSvc.addSanitizedFlagToEvent($scope.localEvent, sanitizedEvent);
                            //This is needed because when the dates are sent over the network, they are serialized
                            deserializeDayForEvent(sanitizedEvent);
                            $scope.localEvent = sanitizedEvent;
                            $scope.hasBeenSanitized = true;
                        } else if(response.data.success){
                            $scope.goToViewDojo();
                        }
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err, 'createEvent() from addOrEditEventCtrl', $scope);
                    })
            }
        };

        var editEvent = function(){
            var errors = helperSvc.validateEventFields([$scope.localEvent]);
            if(!errors){
                var preparedEvent = helperSvc.removeSanitizedFlagsAndErrorsFromEvent($scope.localEvent);
                dataService.editEventOfDojo({event:preparedEvent})
                    .then(function(response){
                        if(response.data.errors === keys.notAuthorizedError){
                            $scope.showNotAuthorizedError();
                        } else if(response.data.errors === keys.notSanitizedError){
                            var sanitizedEvent = response.data.sanitizedEvent;
                            helperSvc.addSanitizedFlagToEvent($scope.localEvent, sanitizedEvent);
                            //This is needed because when the dates are sent over the network, they are serialized
                            deserializeDayForEvent(sanitizedEvent);
                            $scope.localEvent = sanitizedEvent;
                            $scope.hasBeenSanitized = true;
                        } else if(response.data.success){
                            $scope.goToViewEvent();
                        }
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err, 'editEvent() from addOrEditEventCtrl', $scope);
                    })
            }
        };

        //Method for closing the panel informing the user the dojo has suffered modifications when sanitizing
        $scope.closeHasBeenSanitizedInfo = function(){
            $scope.hasBeenSanitized = undefined;
        };

        // Method that converts an event in database format (with tickets), to an event in the client format: with tickets
        // arranged in sessions.
        var convertDataBaseEventToClientEvent = function(dataBaseEvent){
            dataBaseEvent.sessions = helperSvc.convertEventTicketsToSessions(dataBaseEvent.tickets);
            dataBaseEvent.tickets = undefined;
            //Preparing the dates
            var startTime = new Date(dataBaseEvent.startTime);
            dataBaseEvent.startHour = startTime.getHours();
            dataBaseEvent.startMinute = startTime.getMinutes();

            var endTime = new Date(dataBaseEvent.endTime);
            dataBaseEvent.endHour = endTime.getHours();
            dataBaseEvent.endMinute = endTime.getMinutes();
            dataBaseEvent.day = startTime;

            //We need to add the flag even unique for it to display the date for unique events
            dataBaseEvent.type = keys.eventTypesUnique;

            return dataBaseEvent;

        };

        var getAndPrepareEventForEditing = function(){
            dataService.getEventForEditing({eventId: $scope.event._id})
                .then(function(response){
                    var event = response.data.event;
                    if(event){
                        event = convertDataBaseEventToClientEvent(event);
                        $scope.localEvent = event;
                    }else {
                        //If we were not answered with the event, go to view dojo
                        $scope.goToViewDojo();
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getAndPrepareEvent() addOrEditEventCtrl', $scope);
                })

        };

        $scope.initializeEventCtrl = function(){
            if($scope.isCurrentView(keys.editEvent)){
                getAndPrepareEventForEditing();
            } else if($scope.isCurrentView(keys.addEventToDojo)){
                //If the previous view is view dojo, we are adding a new event, and we need to initialize a blank event
                $scope.localEvent = {
                    sessions: [{
                        tickets: [{}],
                        _id: helperSvc.generateSessionId()
                    }],
                    type: keys.eventTypesUnique
                };
            }
        };
        $scope.initializeEventCtrl();

    });