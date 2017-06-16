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

        //Method for closing the panel informing the user the dojo has suffered modifications when sanitizing
        $scope.closeHasBeenSanitizedInfo = function(){
            $scope.hasBeenSanitized = undefined;
        };

        var initializeAddOrEditDojoCtrl = function(){
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
                //Add dojo mode
                $scope.localDojo.recurrentEvents = [];
                $scope.addEmptyEvent($scope.localDojo.recurrentEvents);
                $scope.localDojo.requirements = [{data:''}];
                $scope.localDojo.statuses = [{data:''}];

            }
        };

        initializeAddOrEditDojoCtrl();

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
                $scope.localDojo.requirements.push({data:''});
            }
        };

        $scope.deleteStatus = function(index){
            $scope.localDojo.statuses.splice(index, 1);
            //If the requirement array is empty, we add an empty requirement (which isn't saved, but we need to display something)
            if($scope.localDojo.statuses.length === 0){
                $scope.localDojo.statuses.push({data:''});
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
                        } else if(response.data.errors === keys.notSanitizedError){
                            var dojoWithSanitizedFlags = addSanitizedFlag($scope.localDojo, response.data.sanitizedDojo);
                            $scope.localDojo = addNecessaryEmptyFields(dojoWithSanitizedFlags);
                            $scope.hasBeenSanitized = true;
                        }else if (response.data.success){
                            $location.path('/' + keys.cautaUnDojo);
                            $scope.setAlert(keys.infoAlert, 'Dojo creat cu succes!');
                        }
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err, 'addDojo() - addOrEditDojoCtrl', $scope);
                    })
            }
        };

        //Statuses, requirements and events cannot we empty for them to be displayed correctly using nr-repeat
        // so filler objects must be added (they are removed later when the event is sent to the server)
        var addNecessaryEmptyFields = function(dojo){
            if(dojo.requirements.length == 0){
                dojo.requirements.push({data:''})
            }
            if(dojo.statuses.length == 0){
                dojo.statuses.push({data:''})
            }
            if(dojo.recurrentEvents.length == 0){
                $scope.addEmptyEvent(dojo.recurrentEvents);
            }

            return dojo;
        };

        var addSanitizedFlag = function(dojo, sanitizedDojo){
            if(dojo.name != sanitizedDojo.name){
                sanitizedDojo.sanitName = true;
            }
            if(dojo.address != sanitizedDojo.address){
                sanitizedDojo.sanitAddress = true;
            }
            if(dojo.latitude != sanitizedDojo.latitude){
                sanitizedDojo.sanitLatitude = true;
            }
            if(dojo.longitude != sanitizedDojo.longitude){
                sanitizedDojo.sanitLongitude = true;
            }
            if(dojo.email != sanitizedDojo.email){
                sanitizedDojo.sanitEmail = true;
            }
            if(dojo.facebook != sanitizedDojo.facebook){
                sanitizedDojo.sanitFacebook = true;
            }
            if(dojo.twitter != sanitizedDojo.twitter){
                sanitizedDojo.sanitTwitter = true;
            }

            for(var i = 0; i < dojo.requirements.length; i++){
                //First we convert the requirement into the into the required form for the ng-repeat algorithm
                sanitizedDojo.requirements[i] = {data: sanitizedDojo.requirements[i]};
                if(dojo.requirements[i] != sanitizedDojo.requirements[i].data){
                    sanitizedDojo.requirements[i].sanitRequirement = true;
                }
            }

            for(var i = 0; i < dojo.statuses.length; i++){
                //First we convert the status into the into the required form for the ng-repeat algorithm
                sanitizedDojo.statuses[i] = {data: sanitizedDojo.statuses[i]};
                if(dojo.statuses[i] != sanitizedDojo.statuses[i].data){
                    sanitizedDojo.statuses[i].sanitStatus = true;
                }
            }

            for(var i = 0; i < dojo.recurrentEvents.length; i++){
                helperSvc.addSanitizedFlagToEvent(dojo.recurrentEvents[i], sanitizedDojo.recurrentEvents[i]);
            }
            return sanitizedDojo;
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
                        } else if(response.data.errors === keys.notSanitizedError){
                            var dojoWithSanitizedFlags = addSanitizedFlag($scope.localDojo, response.data.sanitizedDojo);
                            $scope.localDojo = addNecessaryEmptyFields(dojoWithSanitizedFlags);
                            $scope.hasBeenSanitized = true;
                        }else if (response.data.success){
                            //If the dojo was updated, we reload the dojo, running the initialize method from dojoCtrl
                            if($scope.initializeDojoCtrl){
                                $scope.initializeDojoCtrl();
                            }
                        }
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err, 'addDojo() - addOrEditDojoCtrl', $scope);
                    })
            }
        };


        var prepareDojoForSending = function(dojo){
            //Remove sanitize flags from dojo
            dojo.sanitName = undefined;
            dojo.sanitAddress = undefined;
            dojo.sanitLatitude = undefined;
            dojo.sanitLongitude = undefined;
            dojo.sanitEmail = undefined;
            dojo.sanitFacebook = undefined;
            dojo.sanitTwitter = undefined;

            //We clone it because we may need the original later when comparing for sanitization
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
                    preparedRecurrentEvents.push(helperSvc.removeSanitizedFlagsAndErrorsFromEvent(reccurentEvent));
                }
            });
            dojo.recurrentEvents = preparedRecurrentEvents;

            return dojo;
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

            var hasEventErrors = helperSvc.validateEventFields(dojo.recurrentEvents);

            if (hasErrors || hasEventErrors){
                return errors;
            } else {
                return null;
            }
        }
    })//End of addDojoCtrl