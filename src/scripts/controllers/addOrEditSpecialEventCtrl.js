/**
 * Created by catap_000 on 7/5/2017.
 */


angular.module("coderDojoTimisoara")
    .controller("addOrEditSpecialEventCtrl", function($scope, $rootScope, dataService, helperSvc){
        $scope.local = {specialEvent: {}, errors: {}, show: {}, sanitized:{}};
        //Used for the photo change listener
        $scope.initializations = {};

        $scope.addOrEditSpecialEvent = function(){
            if($scope.isEditSpecialEvent()){
                editSpecialEvent();
            } else {
                addSpecialEvent();
            }
        };

        var editSpecialEvent = function(){
            var errors = validateSpecialEventFields();
            if(errors){
                $scope.local.errors = errors;
                $scope.setSnackBar('Erori de validare gasite', 'error');
            } else {
                //reset sanitized flags
                $scope.local.sanitized = {};
                dataService.editSpecialEvent({specialEvent: $scope.local.specialEvent})
                    .then(function(response){
                        if(response.data.errors === keys.notAuthorizedError){
                            $scope.showNotAuthorizedError();
                        } else if(response.data.success){
                            //This calls the go back action from the viewSpecialEventCtrl and goes to viewing the event
                            $scope.goBackAction();
                            $scope.setSnackBar('Eveniment special editat cu success', 'Info');
                        } else if(response.data.sanitSpecialEvent){
                            $scope.hasBeenSanitized = true;
                            addSanitizedFlags(response.data.sanitSpecialEvent);
                            $scope.local.specialEvent = response.data.sanitSpecialEvent;
                            $scope.setSnackBar('Erori de validare gasite', 'error');
                        }
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err, 'addSpecialEvent() - addOrEditSpecialEventCtrl', $scope);
                    })
            }
        };

        var addSpecialEvent = function(){
            var errors = validateSpecialEventFields();
            if(errors){
                $scope.local.errors = errors;
                $scope.setSnackBar('Erori de validare gasite', 'error');
            } else {
                //reset sanitized flags
                $scope.local.sanitized = {};
                dataService.addSpecialEvent({specialEvent: $scope.local.specialEvent})
                    .then(function(response){
                        if(response.data.errors === keys.notAuthorizedError){
                            $scope.showNotAuthorizedError();
                        } else if(response.data.success){
                            $scope.goToEvents();
                            $scope.setSnackBar('Eveniment special creeat cu success', 'Info');
                        } else if(response.data.sanitSpecialEvent){
                            $scope.hasBeenSanitized = true;
                            addSanitizedFlags(response.data.sanitSpecialEvent);
                            $scope.local.specialEvent = response.data.sanitSpecialEvent;
                            $scope.setSnackBar('Erori de validare gasite', 'error');
                        }
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err, 'addSpecialEvent() - addOrEditSpecialEventCtrl', $scope);
                    })
            }
        };

        var validateSpecialEventFields = function(){
            var hasErrors = false;
            var errors = {};

            //Validating the name
            if(!$scope.local.specialEvent.name || ($scope.local.specialEvent.name === '')){
                hasErrors = true;
                errors.nameError = 'Evenimentul trebuie sa aiba nume';
            }

            //Validating the address
            if(!$scope.local.specialEvent.address || ($scope.local.specialEvent.address === '')){
                hasErrors = true;
                errors.addressError = 'Evenimentul trebuie sa aiba adresa';
            }

            //Validating the latitude
            if(!$scope.local.specialEvent.latitude || isNaN($scope.local.specialEvent.latitude)){
                hasErrors = true;
                errors.latError = 'Evenimentul trebuie sa aiba Latitudine care e numar.';
            }

            //Validating the longitude
            if(!$scope.local.specialEvent.longitude|| isNaN($scope.local.specialEvent.longitude)){
                hasErrors = true;
                errors.longError = 'Evenimentul trebuie sa aiba Longitudine care e numar.';
            }

            //Validating the description
            if(!$scope.local.specialEvent.description || ($scope.local.specialEvent.description === '')){
                hasErrors = true;
                errors.descriptionError = 'Evenimentul trebuie sa aiba descriere';
            }

            //Validating the city
            if(!$scope.local.specialEvent.city){
                hasErrors = true;
                errors.cityError = 'Evenimentul trebuie sa aiba oras';
            }

            //Validating the city
            if(!$scope.local.specialEvent.city){
                hasErrors = true;
                errors.cityError = 'Evenimentul trebuie sa aiba oras';
            }

            var startHour = $scope.local.specialEvent.startHour;
            var startMinute = $scope.local.specialEvent.startMinute;
            var endHour = $scope.local.specialEvent.endHour;
            var endMinute = $scope.local.specialEvent.endMinute;


            if((helperSvc.numberValueIsNullOrUndefined(startHour) || isNaN(startHour)) ||
               (helperSvc.numberValueIsNullOrUndefined(startMinute) || isNaN(startMinute)) ||
                (helperSvc.numberValueIsNullOrUndefined(endHour) || isNaN(endHour)) ||
                (helperSvc.numberValueIsNullOrUndefined(endMinute) || isNaN(endMinute)) ||
                (!$scope.local.specialEvent.startDay)                                                ||
                (!$scope.local.specialEvent.endDay)){

                hasErrors = true;
                errors.dateError = 'Trebuiesc toate informatiile legate de datele de start si sfarsit.'
            } else {
                //We create new objects not to modify the originals, and when receiving a sanitized version
                // of the specialEvent from the server it is serialized as a string.
                var startDate = new Date($scope.local.specialEvent.startDay);
                startDate.setHours($scope.local.specialEvent.startHour);
                startDate.setMinutes($scope.local.specialEvent.startMinute);

                var endDate = new Date($scope.local.specialEvent.endDay);
                endDate.setHours($scope.local.specialEvent.endHour);
                endDate.setMinutes($scope.local.specialEvent.endMinute);

                if(endDate.getTime() <= startDate.getTime()){
                    hasErrors = true;
                    errors.dateError = 'Sfarsitul evenimentului trebuie sa fie dupa inceput.'
                }
            }

            if(hasErrors){
                return errors;
            }

        };


        var addSanitizedFlags = function(sanitizedEvent){
            if($scope.local.specialEvent.startHour != sanitizedEvent.startHour){
                $scope.local.sanitized.sanitName = true;
            }
            if($scope.local.specialEvent.address != sanitizedEvent.address){
                $scope.local.sanitized.sanitAddress = true;
            }
            if($scope.local.specialEvent.endHour != sanitizedEvent.endHour){
                $scope.local.sanitized.sanitEndHour = true;
            }
            if($scope.local.specialEvent.startMinute != sanitizedEvent.startMinute){
                $scope.local.sanitized.sanitStartMinute = true;
            }
            if($scope.local.specialEvent.endMinute != sanitizedEvent.endMinute){
                $scope.local.sanitized.sanitEndMinute = true;
            }

            if($scope.local.specialEvent.name != sanitizedEvent.name){
                $scope.local.sanitized.sanitName = true;
            }
            if($scope.local.specialEvent.description != sanitizedEvent.description){
                $scope.local.sanitized.sanitDescription = true;
            }
            if($scope.local.specialEvent.latitude != sanitizedEvent.latitude){
                $scope.local.sanitized.sanitLatitude = true;
            }
            if($scope.local.specialEvent.longitude != sanitizedEvent.longitude){
                $scope.local.sanitized.sanitLongitude = true;
            }
            if($scope.local.specialEvent.city != sanitizedEvent.city){
                $scope.local.sanitized.sanitCity = true;
            }
        };

        $scope.isEditSpecialEvent = function(){
            return $scope.isParentCtrlViewSpecialEventCtrl;
        };

        $scope.getEventBttnName = function(){
            if($scope.isEditSpecialEvent()){
                return 'Editează eveniment';
            } else {
                return 'Creează eveniment';
            }
        };

        $scope.getBackgroundUrlForSpecialEventPhoto = function(specialEvent){
            return helperSvc.getBackgroundUrlForSpecialEventPhoto(specialEvent);
        };

        //Method for opening dialog for changing special event photo
        $scope.changeSpecialEventPhoto = function(){
            var $fileInput = $('#special-event-photo-input');
            //This is so the listener is only added once
            if(!($scope.initializations[keys.uploadPhotoListenerInitiated])){
                $fileInput.on('change', function(event){
                    //This event triggers when the users selects a file
                    var $fileInput = $('#special-event-photo-input');
                    //we check to see if a file was selected
                    if ($fileInput[0].files.length > 0){
                        //We build a formData from the hidden file input used
                        var formData = new FormData();
                        formData.append('specialEventId', $scope.local.specialEvent._id);
                        formData.append('special-event-photo', $fileInput[0].files[0]);
                        dataService.uploadSpecialEventPhoto(formData)
                            .then(function(response){
                                if(response.data.errors === keys.uploadedPhotoTooLargeError){
                                    $scope.setSnackBar('Poza este prea mare. Maxim 1 de MB', 'error');
                                } else if (response.data.errors === keys.uploadedPhotoNotCorrectMimeTypeError){
                                    $scope.setSnackBar('Poza nu este un format acceptat (jpg, png).', 'error');
                                } else if (response.data.errors === keys.notAuthorizedError){
                                    $scope.showNotAuthorizedError();
                                } else if(response.data.specialEventPhoto){
                                    $scope.local.specialEvent.photo = response.data.specialEventPhoto;
                                    var msg = 'Poza evenimentului special '  + $scope.local.specialEvent.name + ' '  +
                                        ' a fost schimbata cu success';
                                    $scope.setSnackBar(msg, 'info');
                                }
                            })
                            .catch(function(err){
                                console.log(err);
                            });
                    }
                });
                //We set the initialized flag to true, for the event listener to be activated only once
                $scope.initializations[keys.uploadPhotoListenerInitiated] = true;
            }
            //We simulate a click on the hidden file input to open the dialog
            $fileInput.click();
        };

        //Method for converting the startTime and endTime from string date objects to hours, minutes, and days
        var convertToClientSpecialEvent = function(serverSpecialEvent){
            var startDate = new Date(serverSpecialEvent.startTime);
            serverSpecialEvent.startMinute = startDate.getMinutes();
            serverSpecialEvent.startHour = startDate.getHours();
            serverSpecialEvent.startDay = startDate;
            serverSpecialEvent.startDate = undefined;

            var endDate = new Date(serverSpecialEvent.endTime);
            serverSpecialEvent.endMinute = endDate.getMinutes();
            serverSpecialEvent.endHour = endDate.getHours();
            serverSpecialEvent.endDay = endDate;
            serverSpecialEvent.endDate = undefined;

            return serverSpecialEvent;

        };

        var intializeAddOrEditSpecialEventCtrl = function(){
            var specialEventView = $scope.getSpecialEventView();
            if($scope.isEditSpecialEvent()){
                dataService.getSpecialEvent({specialEventId: specialEventView.specialEventId})
                    .then(function(response){
                        if(response.data.specialEvent){
                            $scope.local.specialEvent = convertToClientSpecialEvent(response.data.specialEvent);
                        }
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err, 'initializeSpecialEventCtrl() specialEventCtrl', $scope);
                    })
            }
        };

        intializeAddOrEditSpecialEventCtrl();
    });
