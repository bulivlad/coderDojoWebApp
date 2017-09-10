/**
 * Created by catap_000 on 7/15/2017.
 */


angular.module("coderDojoTimisoara")
    .controller("changeUserPasswordsCtrl", function($scope, $rootScope, $location, $compile, dataService, helperSvc) {
        $scope.errors = {};
        $scope.info = {};
        $scope.sanitized = {};
        $scope.passwords = {};
        $scope.show = {};
        $scope.changeOrAddPasswordButton = 'Schimba parola';

        $scope.changePassword = function(){
            $scope.errors = {}; resetSanitizedInfo();
            $scope.setCommunicationsPermitted(false);

            var errors = validateFields();
            if(errors){
                $scope.setSnackBar('Exista erori in formular', 'error');
                $scope.errors = errors;
            } else {
                var userId = $scope.myProfile.user._id;
                dataService.changeUserPassword(
                    {
                        userId: userId,
                        oldPassword: $scope.passwords.oldPassword,
                        newPassword: $scope.passwords.newPassword,
                        newPassword2: $scope.passwords.newPassword2
                    }
                )
                .then(function(response){
                    $scope.setCommunicationsPermitted(true);
                    if(response.data.errors){
                        if(response.data.errors == keys.notAuthorizedError){
                            $scope.showNotAuthorizedError();
                        } else {
                            $scope.errors = response.data.errors;
                            $scope.setSnackBar('Exista erori in formular', 'error');
                        }
                    } else if(response.data.sanitizedNewPassword){
                        $scope.sanitized.hasBeenSanitized = true;
                        $scope.sanitized.newPassword = true;
                        $scope.passwords.newPassword = '';
                        $scope.setSnackBar('Exista erori in formular', 'error');
                    } else if(response.data.success){
                        var user = $scope.myProfile.user;
                        $scope.setSnackBar('Utilizatorului ' + user.firstName + ' ' + user.lastName + ' + ' +
                            ' i-a fost schimbată parola cu success', 'info');
                        $scope.initializeEditProfilesController();
                    }

                })
                .catch(function(err){
                    $scope.setCommunicationsPermitted(true);
                    helperSvc.handlerCommunicationErrors(err, 'changePassword() changeUserPasswordsCtrl')
                })
            }
        };

        var resetSanitizedInfo = function(){
            $scope.sanitized = {};
        };

        var validateFields = function(){
            var hasErrors = false;
            var errors = {};
            if($scope.hasPassword){
                if(!$scope.passwords.oldPassword){
                    hasErrors = true;
                    errors.oldPassword = 'Parola veche lipseste';
                }
            }

            if(!$scope.passwords.newPassword){
                hasErrors = true;
                errors.newPassword = 'Parola noua lipseste';
            } else {
                if($scope.passwords.newPassword != $scope.passwords.newPassword2){
                    hasErrors = true;
                    errors.newPassword2 = 'Confirmarea parolei nu e buna.';
                }
            }

            if(hasErrors){
                return errors;
            }
        };


        var initializeChangeUserPasswordCtrl = function(){
            var userId = $scope.myProfile.user._id;

            dataService.getChangeUserPasswordInfoFromServer({userId: userId})
                .then(function(response){
                    if(response.data.errors === keys.notAuthorizedError){
                        $scope.showNotAuthorizedError();
                    } else if(response.data.changeInfo){
                        $scope.hasPassword = response.data.changeInfo.hasPassword;
                        if(!$scope.hasPassword){
                            $scope.changeOrAddPasswordButton = 'Adauga parola';
                        } else {
                            $scope.show.showOldPassword= true;
                        }
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'initializeChangeUserPasswordCtrl() changeUserPasswordsCtrl', $scope);
                })
        }

        initializeChangeUserPasswordCtrl();
    });