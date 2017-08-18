/**
 * Created by catap_000 on 7/3/2017.
 */


angular.module("coderDojoTimisoara")
    .controller("showEventsCtrl", function($scope, $rootScope, dataService, helperSvc){
        //This controller is used to display and filer a list of events. Originally it will be used
        // to display a user's events (evenimentele mele) and current dojo events (evenimente curente la dojo-uri).

        $scope.showEvents = {events:[], filteredEvents:[]};
        $scope.filterByDojo = ['Toate dojo-urile'];
        $scope.filters = {};
        $scope.filters.selectedFilterByDojo = $scope.filterByDojo[0];
        $scope.filterByWorkshop = ['Toate atelierele'];
        $scope.filters.selectedFilterByWorkshop = $scope.filterByWorkshop[0];

        $scope.filterEvents = function(){
            var filteredEvents = [];
            $scope.showEvents.events.forEach(function(event){
                var filtersFulfilled = true;

                if($scope.filters.selectedFilterByDojo != $scope.filterByDojo[0]){
                    //It is not all dojos
                    if(event.dojoName != $scope.filters.selectedFilterByDojo){
                        filtersFulfilled = false;
                    }
                }
                if(filtersFulfilled && ($scope.filters.selectedFilterByWorkshop != $scope.filterByWorkshop[0]) ){
                    //It is not all workshops
                    if(event.workshops.indexOf($scope.filters.selectedFilterByWorkshop) < 0){
                        filtersFulfilled = false;
                    }
                }

                if(filtersFulfilled){
                    filteredEvents.push(event);
                }
            });
            $scope.showEvents.filteredEvents =  filteredEvents;
        };

        $scope.viewDojoAction = function(localEvent){
            //This sets a dojo in the viewDojo panel
            var oldView = keys.myEventsLocation;
            if($scope.isParentCtrlEventsViewCtrl){
                oldView = keys.eventsLocation;
            }
            $scope.setDojoSelector(oldView);
            $scope.setToBeViewedDojoId(localEvent.dojoId);
            $scope.goToViewDojo();
        };


        this.getEventDate = function(event, forUniqueEvents){
            var ret = '';
            var startTime = new Date(event.startTime);
            var endTime = new Date(event.endTime);
            //This is a weekly event
            if(event.copyOfRecurrentEvent && !forUniqueEvents){
                ret = 'În fiecare ' + keys.daysOfWeek[startTime.getDay()] + ' ' +
                    startTime.getHours() + ':' +
                    this.adjustOneNumberMinutes(startTime.getMinutes()) + ' - ' +
                    endTime.getHours() + ':' +
                    this.adjustOneNumberMinutes(endTime.getMinutes());
            } else {
                ret = this.capitalizeFirstLetter(keys.daysOfWeek[startTime.getDay()]) + ' ' +  startTime.getDate() +
                    ' ' + keys.months[startTime.getMonth()] + ' de la ' +
                    startTime.getHours() + ':'  +
                    this.adjustOneNumberMinutes(startTime.getMinutes()) + ' - ' +
                    endTime.getHours() + ':'  +
                    this.adjustOneNumberMinutes(endTime.getMinutes());
            }
            return ret;
        };

        //Method for getting the event date
        var getEventDateInfo = function(event){
            ret = {};
            var startTime = new Date(event.startTime);
            var endTime = new Date(event.endTime);
            if(!event.copyOfRecurrentEvent){
                ret.isUniqueEvent = true;
            }

            ret.startHour = startTime.getHours();
            ret.startMinute = helperSvc.adjustOneNumberMinutes(startTime.getMinutes());

            ret.endHour = endTime.getHours();
            ret.endMinute = helperSvc.adjustOneNumberMinutes(endTime.getMinutes());

            ret.eventDay = helperSvc.capitalizeFirstLetter(keys.daysOfWeek[startTime.getDay()]);
            ret.eventDayOfMonth = startTime.getDate();
            ret.eventMonth = helperSvc.capitalizeFirstLetter(keys.months[startTime.getMonth()]);

            ret.month = keys.months[startTime.getMonth()];

            return ret;
        };

        $scope.getEventHours = function(event){
            return ' de la ' + event.dateInfo.startHour + ':' + event.dateInfo.startHour + ' până la ' +
                event.dateInfo.endHour + ':' + event.dateInfo.endHour
        }

        $scope.goToEventAction  = function(event){

        };

        $scope.viewEventAction = function(event){
            var oldView = keys.myEventsLocation;
            if($scope.isParentCtrlEventsViewCtrl){
                oldView = keys.eventsLocation;
            }
            $scope.setEventView(event._id, oldView);
            $scope.goToViewEvent();
        };

        // Method that extracts two lists of unique dojos and event workshops for the filters, and prepares the event
        // for display.
        var prepareEventsAndExtractFilters = function(events){
            //First we extract dojo names for filtering
            events.forEach(function(event){
                if($scope.filterByDojo.indexOf(event.dojoName) < 0){
                    $scope.filterByDojo.push(event.dojoName)
                }
                //Next we extract workshops
                event.workshops = [];
                event.tickets.forEach(function(eventTicket){
                    event.dateInfo = getEventDateInfo(event);
                    if($scope.filterByWorkshop.indexOf(eventTicket.workshop) < 0){
                        $scope.filterByWorkshop.push(eventTicket.workshop)
                    }
                    //We add all the workshops from the ticket to the event
                    if(event.workshops.indexOf(eventTicket.workshop) < 0){
                        event.workshops.push(eventTicket.workshop);
                    }
                });
            })
        };

        var initializeShowEventsCtrl = function(){
            var eventsGettingMethod = dataService.getMyEvents;
            if($scope.isParentCtrlEventsViewCtrl){
                if($scope.isUserLoggedIn()){
                    eventsGettingMethod = dataService.getCurrentAuthEvents;    
                } else {
                    eventsGettingMethod = dataService.getCurrentEvents;
                }
                
            }
            eventsGettingMethod()
                .then(function(response){
                    if(response.data.events){
                        prepareEventsAndExtractFilters(response.data.events);
                        $scope.showEvents.events = response.data.events;
                        $scope.showEvents.filteredEvents = $scope.showEvents.events;
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'initializeShowEventsCtrl() showEventsCtrl', $scope);
                })
        };

        initializeShowEventsCtrl();
    });