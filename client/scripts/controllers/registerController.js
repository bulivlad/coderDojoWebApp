/**
 * Created by Adina Paraschiv on 3/1/2017.
 */

angular.module("coderDojoTimisoara")
    .controller('registerController', function($scope, $rootScope, dataService, helperSvc, $location){
        //This method initialized the date picker (Jquery)
        $( function() {
            $( "#datepicker" ).datepicker({
                changeMonth: true,
                changeYear: true,
                maxDate: "0",
                yearRange: "-90:+0" //90 year olds can make accounts
            });
        } );

        //We declare the register object, with an empty errors object.
        $scope.register = {errors:{}};

        //Method that validates the fields from the register panel and sends the request to the server for registration
        $scope.registerUser = function(){
            //First we reset any existing connection error
            $scope.register.errors.connectionError = undefined;

            //Second we validate the fields extracted from the html
            var errors = helperSvc.validateFields($scope.register.user, keys.regUserOver14Profile);
            if (errors){
                //If there are errors in the fields, we set the errors to the scope (and share it with the html)
                $scope.register.errors = errors;
            } else {
                //If there were no errors, we sent the register request to the server
                dataService.registerUser($scope.register.user)
                    .then(function(response){
                        if(response.data.errors){
                            // If there are validation errors received from the server (there is sever side validation as well), we
                            // set the errors to the scope (and share it with the html)
                            $scope.register.errors = helperSvc.convertServerErrorsToClientErrors(response.data.errors);
                        }else if (response.data.success){
                            //IF the request was successful, we set a just register flag, and
                            // go to the login page.
                            $rootScope.justRegistered = true;
                            $location.path('/' + keys.login);
                        }
                    })
                    .catch(function(err){
                        //No connection error
                        if(err.status === -1){
                            $scope.register.errors.connectionError = 'Probleme cu conexiunea';
                        } else {
                            // If the communication was unsuccessful for another reason, we handle the error
                            helperSvc.handlerCommunicationErrors(err, 'registerController - registerUser', $scope);
                        }
                    });
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