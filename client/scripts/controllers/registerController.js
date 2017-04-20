/**
 * Created by Adina Paraschiv on 3/1/2017.
 */

angular.module("coderDojoTimisoara")
    .controller('registerController', function($scope, $rootScope, dataService, helperSvc, $location){
        $( function() {
            $( "#datepicker" ).datepicker({
                changeMonth: true,
                changeYear: true,
                maxDate: "0",
                yearRange: "-90:+0" //90 year olds can make accounts
            });
        } );

        $scope.register = {};

        //Method that validates the fields from the register panel and sends the request to the server for registration
        $scope.registerUser = function(){
            console.log('Entering registerUser');
            var errors = helperSvc.validateFields($scope.register, keys.regUserOver14Profile);
            errors = null;
            if (errors){
                $scope.register.errors = errors;
            } else {
                var user = {
                    firstName: $scope.register.firstName,
                    lastName: $scope.register.lastName,
                    email: $scope.register.email,
                    password: $scope.register.password,
                    password2: $scope.register.password2,
                    birthDate: $scope.register.birthDate,
                    address: $scope.register.address,
                    phone: $scope.register.phone

                };
                dataService.registerUser(user)
                    .then(function(response){
                        if(response.data.errors){
                            $scope.register.errors = helperSvc.convertServerErrorsToClientErrors(response.data.errors);

                        }else if (response.data.success){
                            resetValues($scope.register);
                            $rootScope.justRegistered = true;
                            $location.path('/' + keys.login);
                        }
                    })
                    .catch(function(err){
                        if (err.status === -1){
                            $scope.register.errors = {name:'Verificati conexiunea la internet'}
                        } else {
                            $scope.register.errors = {name:'Probleme de comunicare cu serverul'};
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