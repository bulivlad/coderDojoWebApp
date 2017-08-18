/**
 * Created by Adina Paraschiv on 3/1/2017.
 */

angular.module("coderDojoTimisoara")
    .controller('registerCtrl', function($scope, $rootScope, dataService, helperSvc, $location){

        //This method initialized the date picker (Jquery)
        $( function() {
            $( "#datepicker" ).datepicker({
                changeMonth: true,
                changeYear: true,
                maxDate: "0",
                dayNamesMin:keys.daysOfWeekShort,
                monthNamesShort:keys.months,
                yearRange: "-90:+0" //90 year olds can make accounts

            });
        } );

        //We declare the register object, with an empty errors object.
        $scope.register = {errors:{}, sanitize: {}};
        $scope.info = {};

        $scope.closeHasBeenSanitizedInfo = function(){
            $scope.register.sanitize.hasBeenSanitized = false;
        };

        var resetSanitizedInfo = function(){
            $scope.register.sanitize = {};
        };

        //Method that validates the fields from the register panel and sends the request to the server for registration
        $scope.registerUser = function(){
            resetSanitizedInfo();

            //Second we validate the fields extracted from the html
            var errors = helperSvc.validateFields($scope.register.user, keys.regUserOver14Profile);
            if (errors){
                //If there are errors in the fields, we set the errors to the scope (and share it with the html)
                $scope.register.errors = errors;
                $scope.setSnackBar('Exista erori in datele introduse', 'error');
            } else {
                //If there were no errors, we sent the register request to the server
                dataService.registerUser($scope.register.user)
                    .then(function(response){
                        if(response.data.errors){
                            // If there are validation errors received from the server (there is sever side validation as well), we
                            // set the errors to the scope (and share it with the html)
                            $scope.register.errors = helperSvc.convertServerErrorsToClientErrors(response.data.errors);
                            $scope.setSnackBar('Exista erori in datele introduse', 'error');
                        }else if (response.data.sanitizedUser){
                            //If the server has sanitized the user that was send, we receive the sanitized version
                            $scope.register.sanitize.hasBeenSanitized = true;
                            addSanitizeFlags($scope.register.user, response.data.sanitizedUser);
                            $scope.register.user = response.data.sanitizedUser;
                            $scope.setSnackBar('Exista erori in datele introduse', 'error');
                        } else if (response.data.success){
                            //IF the request was successful, we set a just register flag, and
                            // go to the login page.
                            $scope.goToLogin();
                            $scope.setSnackBar('Cont utilizator creat cu success', 'info');
                        }
                    })
                    .catch(function(err){
                        // If the communication was unsuccessful for another reason, we handle the error
                        helperSvc.handlerCommunicationErrors(err, 'registerController - registerUser', $scope);
                    });
            }
        };

        var addSanitizeFlags = function(user, sanitizedUser){
            if(user.email !== sanitizedUser.email){
                $scope.register.sanitize.email = true;
            }
            if(user.password !== sanitizedUser.password){
                $scope.register.sanitize.password = true;
            }
            if(user.firstName !== sanitizedUser.firstName){
                $scope.register.sanitize.firstName = true;
            }
            if(user.lastName !== sanitizedUser.lastName){
                $scope.register.sanitize.lastName = true;
            }
            if(user.birthDate !== sanitizedUser.birthDate){
                $scope.register.sanitize.birthDate = true;
            }
            if(user.address !== sanitizedUser.address){
                $scope.register.sanitize.address = true;
            }
            if(user.phone !== sanitizedUser.phone){
                $scope.register.sanitize.phone = true;
            }
        };

        var resetValues = function(register){
            register.firstName = '';
            register.lastName = '';
            register.email = '';
            register.password = '';
            register.password2 = '';
            register.phone = '';
            register.address = '';
            register.birthDate = '';
        };

        resetValues($scope.register);

    });