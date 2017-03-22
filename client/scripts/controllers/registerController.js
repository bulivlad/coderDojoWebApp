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
            var errors = helperSvc.validateFields($scope.register, true);
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
                            $scope.register.errors = {};
                            response.data.errors.forEach(function(error){
                               if (error.param.includes('birthDate')){
                                   $scope.register.errors.birthDate = error.msg;
                               } else if (error.param.includes('address')){
                                   $scope.register.errors.address = error.msg;
                               } else if (error.param.includes('firstName')){
                                   $scope.register.errors.firstName = error.msg;
                               } else if (error.param.includes('lastName')){
                                   $scope.register.errors.lastName = error.msg;
                               } else if (error.param.includes('email')){
                                   $scope.register.errors.email = error.msg;
                               } else if (error.param.includes('password')){
                                   $scope.register.errors.password = error.msg;
                               } else if (error.param.includes('password2')){
                                   $scope.register.errors.password2 = error.msg;
                               } else if (error.param.includes('phone')){
                                   $scope.register.errors.phone = error.msg;
                               }
                            });
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