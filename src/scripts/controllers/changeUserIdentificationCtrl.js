/**
 * Created by catap_000 on 7/13/2017.
 */

angular.module("coderDojoTimisoara")
    .controller("changeUserIdentificationCtrl", function($scope, $rootScope, $location, $compile, dataService, helperSvc) {
        $scope.errors = {};
        $scope.info = {};
        $scope.sanitized = {};
        $scope.changeInfo = {};
        $scope.changeOrAddEmailButton = 'Schimba email';
        $scope.changeOrAddAliasButton = 'Schimba alias';

        var resetSanitizedInfo = function(){
            $scope.sanitized = {};
        };

        $scope.changeUsersAlias = function(){
            //Resetting errors and sanitization
            $scope.errors = {}; resetSanitizedInfo();

            $scope.setCommunicationsPermitted(false);
            if(!$scope.changeInfo.newAlias){
                $scope.errors.newAlias = "Aliasul lipseste";
                $scope.setSnackBar('Exista erori in formular', 'error');
            } else {
                var userId = $scope.myProfile.user._id;
                dataService.changeUsersAlias({userId:userId, newAlias: $scope.changeInfo.newAlias})
                    .then(function(response){
                        $scope.setCommunicationsPermitted(true);
                        if(response.data.errors){
                            if(response.data.errors == keys.notAuthorizedError){
                                $scope.showNotAuthorizedError();
                            } else {
                                $scope.setSnackBar('Exista erori in formular', 'error');
                                $scope.errors = response.data.errors;
                            }
                        } else if (response.data.sanitizedNewAlias){
                            $scope.sanitized.hasBeenSanitized = true;
                            $scope.sanitized.newAlias = true;
                            $scope.changeInfo.newAlias = response.data.sanitizedNewAlias;
                            $scope.setSnackBar('Exista erori in formular', 'error');
                        } else if (response.data.success){
                            var user = $scope.myProfile.user;
                            $scope.setSnackBar('Utilizatorului ' + user.firstName + ' ' + user.lastName +
                                ' i-a fost schimbat aliasul cu success', 'info');
                            $scope.initializeEditProfilesController();
                        }
                    })
                    .catch(function(err){
                        $scope.setCommunicationsPermitted(true);
                        helperSvc.handlerCommunicationErrors(err, 'changeUsersAlias() changeUserIdentificationInfoCtrl', $scope);
                    })
            }
        };

        $scope.changeUsersEmail = function(){
            //Resetting errors and sanitization
            $scope.errors = {}; resetSanitizedInfo();

            $scope.setCommunicationsPermitted(false);
            if(!$scope.changeInfo.newEmail){
                $scope.errors.newEmail = "Email-ul lipseste";
                $scope.setSnackBar('Exista erori in formular', 'error');
            } else {
                var userId = $scope.myProfile.user._id;
                dataService.changeUsersEmail({userId:userId, newEmail: $scope.changeInfo.newEmail})
                    .then(function(response){
                        $scope.setCommunicationsPermitted(true);
                        if(response.data.errors){
                            if(response.data.errors == keys.notAuthorizedError){
                                $scope.showNotAuthorizedError();
                            } else {
                                $scope.errors = response.data.errors;
                                $scope.setSnackBar('Exista erori in formular', 'error');
                            }
                        } else if (response.data.sanitizedNewEmail){
                            $scope.sanitized.hasBeenSanitized = true;
                            $scope.sanitized.newEmail = true;
                            $scope.changeInfo.newEmail = response.data.sanitizedNewEmail;
                            $scope.setSnackBar('Exista erori in formular', 'error');
                        } else if (response.data.success){
                            var user = $scope.myProfile.user;
                            $scope.setSnackBar('Utilizatorului ' + user.firstName + ' ' + user.lastName +
                                ' i-a fost schimbat email-ul cu success', 'info');
                            $scope.initializeEditProfilesController();
                        }
                    })
                    .catch(function(err){
                        $scope.setCommunicationsPermitted(true);
                        helperSvc.handlerCommunicationErrors(err, 'changeUsersEmail() changeUserIdentificationInfoCtrl', $scope);
                    })
            }
        };


        $scope.closeHasBeenSanitizedInfo = function(){
            $scope.sanitized.hasBeenSanitized = false;
        };

        var intializeChangeInfoCtrl = function(){
            var userId = $scope.myProfile.user._id;

            dataService.getChangeUserIdentificationInfoFromServer({userId: userId})
                .then(function(response){
                    if(response.data.errors === keys.notAuthorizedError){
                        $scope.showNotAuthorizedError();
                    } else if(response.data.changeInfo){
                        $scope.oldEmail = response.data.changeInfo.oldEmail;
                        if(!$scope.oldEmail){
                            $scope.changeOrAddEmailButton = 'Adaugă email';
                        }
                        $scope.oldAlias = response.data.changeInfo.oldAlias;
                        if(!$scope.oldAlias){
                            $scope.changeOrAddAliasButton = 'Adaugă alias';
                        }
                        $scope.showChangeEmail = response.data.changeInfo.showChangeEmail;
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'intializeChangeInfoCtrl() changeUserIdentificationInfoCtrl', $scope);
                })
        }


        intializeChangeInfoCtrl();
    });
