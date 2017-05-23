/**
 * Created by Adina Paraschiv on 4/25/2017.
 */


angular.module("coderDojoTimisoara")
    .controller('addOrEditDojoCtrl', function($scope, $rootScope, $location, dataService, helperSvc){
        $scope.errors = {};
        $scope.localDojo = {};
        $scope.title = 'Creează dojo';
        //$scope.daysOfWeek = keys.daysOfWeek;

        var isEditingMode = function(){
            //If we are part of the dojosCtrl, we have this method  in our parent scope, and we check for editing mode
            if($scope.isCurrentView){
                return $scope.isCurrentView(keys.editDojo);
            }
        };

        var initializeAddDojoCtrl = function(){
            if($scope.dojo){//If the this controller is launched to edit a dojo (a dojo exists in the scope)
                //We clone the object so we do not modify the original
                $scope.localDojo = angular.copy($scope.dojo);
                $scope.title = 'Editează dojo';
                $scope.showBackButton = isEditingMode();
                //We need to initialize the schedules array with at least one empty object
                if(!$scope.localDojo.recurrentEvents){
                    $scope.localDojo.recurrentEvents = [];
                    $scope.addEmptyEvent($scope.localDojo.recurrentEvents);
                } else if ($scope.localDojo.recurrentEvents.length === 0){
                    $scope.addEmptyEvent($scope.localDojo.recurrentEvents);
                }
                //We need to initialize the requirements array with at least one empty requirement
                if(!$scope.localDojo.requirements || $scope.localDojo.requirements.length === 0){
                    $scope.localDojo.requirements = [{data:''}];
                } else {
                    //For the ng-repeat directive to work, we need the requirement in requirements to be an object, not
                    // a simple string
                    for(var i = 0; i <$scope.localDojo.requirements.length; i++){
                        $scope.localDojo.requirements[i] = {data: $scope.localDojo.requirements[i]};
                    }
                }
                //We need to initialize the statuses array with at least one empty requirement
                if(!$scope.localDojo.statuses || $scope.localDojo.statuses.length === 0){
                    $scope.localDojo.statuses = [{data:''}];
                } else {
                    //For the ng-repeat directive to work, we need the status in statuses to be an object, not
                    // a simple string
                    for(var i = 0; i <$scope.localDojo.statuses.length; i++){
                        $scope.localDojo.statuses[i] = {data: $scope.localDojo.statuses[i]};
                    }
                }
            } else {
                $scope.localDojo.recurrentEvents = [];
                $scope.addEmptyEvent($scope.localDojo.recurrentEvents);
                $scope.localDojo.requirements = [{data:''}];
                $scope.localDojo.statuses = [{data:''}];

            }
        };

        initializeAddDojoCtrl();

        //Deletes an event in the que
        $scope.deleteEvent = function(index){
            $scope.localDojo.recurrentEvents.splice(index, 1);
            //If the event array is empty, we add an empty event (which isn't saved, but we need to display something)
            if($scope.localDojo.recurrentEvents.length === 0){
                $scope.addEmptyEvent($scope.localDojo.recurrentEvents);
            }
        };

        //Deletes an requirement in the que
        $scope.deleteRequirement = function(index){
            $scope.localDojo.requirements.splice(index, 1);
            //If the requirement array is empty, we add an empty requirement (which isn't saved, but we need to display something)
            if($scope.localDojo.requirements.length === 0){
                $scope.localDojo.requirements.push('');
            }
        };

        $scope.deleteStatus = function(index){
            $scope.localDojo.statuses.splice(index, 1);
            //If the requirement array is empty, we add an empty requirement (which isn't saved, but we need to display something)
            if($scope.localDojo.statuses.length === 0){
                $scope.localDojo.statuses.push('');
            }
        };

        $scope.addRequirement = function(){
            $scope.localDojo.requirements.push({data:''});
        };

        $scope.addStatus = function(){
            $scope.localDojo.statuses.push({data:''});
        };


        $scope.addOrEditDojo = function(){
            if(isEditingMode()){//if we are in edit dojo mode
                $scope.editDojo();
            } else {//if we are in create dojo mode
                $scope.addDojo();
            }
        };

        $scope.addDojo = function(){
            var errors = validateDojoFields($scope.localDojo);
            if(errors){
                $scope.errors = errors;
            } else {
                dataService.addDojo(prepareDojoForSending($scope.localDojo))
                    .then(function(response){
                        if(response.data.errors === keys.notAuthorizedError){
                            $scope.showNotAuthorizedError();
                        } else if (response.data.success){
                            $location.path('/' + keys.cautaUnDojo);
                            $scope.setAlert(keys.infoAlert, 'Dojo creeat cu succes!');
                        }
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err, 'addDojo() - addDojosCtrl', $scope);
                    })
            }
        };

        $scope.editDojo = function(){
            var errors = validateDojoFields($scope.localDojo);
            if(errors){
                $scope.errors = errors;
            } else {
                dataService.editDojo(prepareDojoForSending($scope.localDojo))
                    .then(function(response){
                        if(response.data.errors === keys.notAuthorizedError){
                            $scope.showNotAuthorizedError();
                        } else if (response.data.success){
                            //If the dojo was updated, we reload the dojo, running the initialize method from dojoCtrl
                            if($scope.initializeDojoCtrl){
                                $scope.initializeDojoCtrl();
                            }
                        }
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err, 'addDojo() - addDojosCtrl', $scope);
                    })
            }
        };


        var prepareDojoForSending = function(dojo){
            var preparedRequirements = [];
            //The requirements/statuses were modified from an array of Strings to an array of objects for the ng-repeat
            // directive to work. Now we are reconverting them back to Strings, and we are removing the empty ones.
            if(dojo.requirements){
                dojo.requirements.forEach(function(requirement){
                    if (requirement.data !== ''){
                        preparedRequirements.push(requirement.data);
                    }
                });
            }
            dojo.requirements = preparedRequirements;

            //Disregard empty statuses
            var preparedStatuses = [];
            if(dojo.statuses){
                dojo.statuses.forEach(function(status){
                    if (status.data !== ''){
                        preparedStatuses.push(status.data);
                    }
                });
            }
            dojo.statuses = preparedStatuses;

            // We only add the recurrent events that are completed by the user (there is a default event that is empty,
            // and we should not add this event (or any other empty events).
            var preparedRecurrentEvents = [];
            dojo.recurrentEvents.forEach(function(reccurentEvent){
                if(!helperSvc.eventIsEmpty(reccurentEvent)){
                    preparedRecurrentEvents.push(reccurentEvent);
                }
            });
            dojo.recurrentEvents = preparedRecurrentEvents;

            removeEventErrors(dojo.recurrentEvents);

            return dojo;
        };

        //Method that removes the extraneous fields from the recurrent events
        var removeEventErrors = function(recurrentEvents){
            recurrentEvents.forEach(function(event){
                event.error = undefined;
                event.sessions.forEach(function(session){
                    session.error = undefined;
                })
            });
        };

        var validateDojoFields = function(dojo){
            var errors = {};
            var hasErrors = false;

            if(!dojo.name || dojo.name === ''){
                hasErrors = true;
                errors.name = 'Dojo-ul trebuie sa aibe nume';
            }

            if(!dojo.address || dojo.address === ''){
                hasErrors = true;
                errors.address = 'Dojo-ul trebuie sa aibe adresa';
            }

            if(!dojo.latitude || dojo.latitude === ''){
                hasErrors = true;
                errors.latitude = 'Dojo-ul trebuie sa aibe latitudine';
            }

            if(!dojo.longitude || dojo.longitude === ''){
                hasErrors = true;
                errors.longitude = 'Dojo-ul trebuie sa aibe longitudine';
            }

            if(!dojo.email || dojo.email === ''){
                hasErrors = true;
                errors.email = 'Dojo-ul trebuie sa aibe email';
            }

            //we need to remove the previous errors if the dojo is resubmitted
            removeEventErrors(dojo.recurrentEvents);

            var hasEventErrors = helperSvc.validateEventFields(dojo.recurrentEvents);

            if (hasErrors || hasEventErrors){
                return errors;
            } else {
                return null;
            }
        }
    })//End of addDojoCtrl