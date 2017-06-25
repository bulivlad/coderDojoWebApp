/**
 * Created by catap_000 on 6/19/2017.
 */

angular.module("coderDojoTimisoara")
    .controller('addOrEditBadgeCtrl', function($scope, $rootScope, $location, dataService, helperSvc){
        //This is needed for the add photo listener
        $scope.initializations = {};

        $scope.getSaveButtonText = function(){
            if($scope.isEditBadgeView()){
                return 'Salvează modificările';
            } else {
                return 'Salvează';
            }
        };

        $scope.isEditBadgeView = function(){
            if($scope.isCurrentView && $scope.isCurrentView(keys.goToEditBadge)){
                return true;
            }
        };

        $scope.showBackButton = function(){
            if($scope.isEditBadgeView()){
                return true;
            }
        };

        //Method for closing the panel informing the user the dojo has suffered modifications when sanitizing
        $scope.closeHasBeenSanitizedInfo = function(){
            $scope.hasBeenSanitized = undefined;
        };

        //Method for opening dialog for adding user picture
        $scope.loadPicture = function(){
            var $fileInput = $('#badge-photo-input');
            //This is so the listener is only added once
            if(!($scope.initializations[keys.uploadPhotoListenerInitiated])){
                $fileInput.on('change', function(event){
                    //This event triggers when the users selects a file
                    var $fileInput = $('#badge-photo-input');
                    //We build a formData from the hidden file input used
                    var formData = new FormData();
                    formData.append('badgeId', $scope.localBadge._id);
                    formData.append('badge-photo', $fileInput[0].files[0]);
                    dataService.uploadBadgePhoto(formData)
                        .then(function(response){
                            if(response.data.badgePhoto){
                                $scope.localBadge.badgePhoto = response.data.badgePhoto;
                            } else if (response.data.errors){
                                if(!$scope.errors){
                                    $scope.errors = {};
                                }
                                $scope.errors[keys.uploadPhotoError] = response.data.errors;
                            }
                        })
                        .catch(function(err){
                            console.log(err);
                        });
                });
                //We set the initialized flag to true, for the event listener to be activated only once
                $scope.initializations[keys.uploadPhotoListenerInitiated] = true;
            }
            //We simulate a click on the hidden file input to open the dialog
            $fileInput.click();
        };



        $scope.saveOrEditBadgeAction = function(){
           if($scope.isEditBadgeView()){
               editBadge();
           } else {
               saveBadge();
           }
        };

        var editBadge = function(){
            var errors = validateBadgeFields();
            if(errors){
                $scope.errors = errors;
            } else {
                dataService.editBadge({badge: removeSanitizeFlagsFromBadge( $scope.localBadge)})
                    .then(function(response){
                        if(response.data.errors === keys.notAuthorizedError){
                            $scope.showNotAuthorizedError();
                        }else if(response.data.errors === keys.notSanitizedError){
                            $scope.hasBeenSanitized = true;
                            $scope.localBadge = addFlagsToBadge($scope.localBadge, response.data.sanitizedBadge);
                        } else if(response.data.success){
                            $scope.views[keys.badgeEdited] = true;
                            //Reset the sanitize flag upon success
                            $scope.hasBeenSanitized = false;
                            //We need to set the original badge (that we edited and is still loaded in the badge viewer), to
                            // the badge in this scope
                            $scope.badge = $scope.setBadge($scope.localBadge);
                        }
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err, 'saveOrEditBadgeAction() - addOrEditBadgeCtrl', $scope);
                    })
            }
        };

        var saveBadge = function(){
            var errors = validateBadgeFields();
            if(errors){
                $scope.errors = errors;
            } else {
                dataService.addBadge({badge: removeSanitizeFlagsFromBadge( $scope.localBadge)})
                    .then(function(response){
                        if(response.data.errors === keys.notAuthorizedError){
                            $scope.showNotAuthorizedError();
                        }else if(response.data.errors === keys.notSanitizedError){
                            $scope.hasBeenSanitized = true;
                            $scope.localBadge = addFlagsToBadge($scope.localBadge, response.data.sanitizedBadge);
                        } else if(response.data.success){
                            $scope.goToViewBadges();
                        }
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err, 'saveOrEditBadgeAction() - addOrEditBadgeCtrl', $scope);
                    })
            }
        };

        var removeSanitizeFlagsFromBadge = function(badge){
            badge.sanitizedName = undefined;
            badge.sanitizedDescription = undefined;
            return badge;
        };

        var addFlagsToBadge = function(badge, sanitizedBadge){
            if(badge.name != sanitizedBadge.name){
                sanitizedBadge.sanitizedName = true;
            }
            if(badge.description!= sanitizedBadge.description){
                sanitizedBadge.sanitizedDescription = true;
            }
            return sanitizedBadge;
        };

        var validateBadgeFields = function(){
            var errors = {};
            var hasErrors = false;
            if(!$scope.localBadge.name || $scope.localBadge.name === ''){
                errors.name = 'Badge-ul trebuie sa aibă nume.';
                hasErrors = true;
            }
            if(!$scope.localBadge.points || $scope.localBadge.points === 0){
                errors.points = 'Badge-ul trebuie sa aibă puncte.';
                hasErrors = true;
            }
            if(!$scope.localBadge.description || $scope.localBadge.description === ''){
                errors.description = 'Badge-ul trebuie sa aibă descriere.';
                hasErrors = true;
            }
            if(hasErrors){
               return errors;
            }


        };

        $scope.goBackAction = function(){
            //This should work only in edit mode (it should not appear in create badge mode)
            if($scope.isEditBadgeView()){
                $scope.goToViewBadge();
            }
        };

        var initializeAddOrEditBadgeCtrl = function(){
            if($scope.isEditBadgeView()){
                $scope.localBadge = $scope.badge;
            } else {
                //If we are creating a new badge
                $scope.localBadge = {};
            }
        };

        initializeAddOrEditBadgeCtrl();
    });