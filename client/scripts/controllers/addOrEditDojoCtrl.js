/**
 * Created by Adina Paraschiv on 4/25/2017.
 */


angular.module("coderDojoTimisoara")
    .controller('addOrEditDojoCtrl', function($scope, $rootScope, $location, dataService, helperSvc){
        $scope.errors = {};
        $scope.localDojo = {};
        $scope.title = 'Creează dojo';

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
                if(!$scope.localDojo.schedules || $scope.localDojo.schedules.length === 0){
                    $scope.localDojo.schedules = [{}];
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
                $scope.localDojo.schedules = [{}];
                $scope.localDojo.requirements = [{data:''}];
                $scope.localDojo.statuses = [{data:''}];

            }
        };

        initializeAddDojoCtrl();

        //Deletes an event in the que
        $scope.deleteEvent = function(index){
            $scope.localDojo.schedules.splice(index, 1);
            //If the event array is empty, we add an empty event (which isn't saved, but we need to display something)
            if($scope.localDojo.schedules.length === 0){
                $scope.localDojo.schedules.push({});
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
                dataService.addDojo({dojo: prepareDojoForSending($scope.localDojo)})
                    .then(function(response){
                        if(response.data.errors === keys.notAuthorizedError){
                            $location.path('/' + keys.despre);
                            $scope.setAlert(keys.errorAlert, 'Nu esti autorizat pentru aceasta operatiune!');
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
                            $location.path('/' + keys.despre);
                            $scope.setAlert(keys.errorAlert, 'Nu esti autorizat pentru aceasta operatiune!');
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

            var preparedStatuses = [];
            if(dojo.statuses){
                dojo.statuses.forEach(function(status){
                    if (status.data !== ''){
                        preparedStatuses.push(status.data);
                    }
                });
            }
            dojo.statuses = preparedStatuses;

            var preparedSchedules = [];
            if(dojo.schedules){
                dojo.schedules.forEach(function(schedule){
                    //We verify that the all the required fields are filled, and we add the schedule
                    if (!((!schedule.startHour && schedule.startHour != 0) || (!schedule.endHour && schedule.endHour != 0) ||
                        (!schedule.startMinute && schedule.startMinute != 0) || (!schedule.endMinute && schedule.endMinute != 0) ||
                        !schedule.day)){
                        preparedSchedules.push(schedule);
                    }
                });
            }
            dojo.schedules = preparedSchedules;

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

            if(dojo.schedules){
                for(var i = 0; i <dojo.schedules.length; i++){
                    var schedule = dojo.schedules[i];
                    if ((!schedule.startHour && schedule.startHour != 0) || (!schedule.endHour && schedule.endHour != 0) ||
                        (!schedule.startMinute && schedule.startMinute != 0) || (!schedule.endMinute && schedule.endMinute != 0) ||
                        !schedule.day){
                        hasErrors = true;
                        errors.schedules = 'Toate orarele trebuie să aibe începutul, sfârșitul și ziua';
                    } else if(schedule.startHour >= schedule.endHour) {
                        hasErrors = true;
                        errors.schedules = 'Evenenimentul trebuie sa inceapă inainte de a se termina';
                    }
                }
            }

            if (hasErrors){
                return errors;
            } else {
                return null;
            }
        }
    })//End of addDojoCtrl