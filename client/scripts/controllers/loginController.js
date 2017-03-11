/**
 * Created by Adina Paraschiv on 3/1/2017.
 */

angular.module("coderDojoTimisoara")
    .controller('loginController', function($scope, $rootScope, $location, dataService){
        $scope.login = {};
        $scope.login.email = undefined;
        $scope.login.password = undefined;

        $scope.loginUser = function(){
            $rootScope.justRegistered = undefined;
            var errors = validateLoginFields($scope.login);
            if (errors){
                $scope.login.errors = errors;
            } else {
                var user = {
                    email:$scope.login.email,
                    password: $scope.login.password
                };
                dataService.loginUser(user, function(err, response){
                    if (err){
                        if(err.status === 401){
                            $scope.login.errors = {email:'Email-ul sau parola nu sunt corecte'};
                        } else if (err.status === -1){
                            $scope.login.errors = {email:'Verificati conexiunea la internet'};
                        } else {
                            $scope.login.errors = {email:'Probleme de comunicare cu serverul'};
                        }
                        console.log("there was an error: ", err);
                    } else {
                        if(response.data.errors){
                            $scope.login.errors = response.data.errors;
                        }else if (response.data.user){
                            $rootScope.user = response.data.user;
                            resetValues($scope.login);
                            $location.path('/' + keys.despre);
                        }
                    }
                });
            }

        };

        var validateLoginFields = function(login){
            var errors = {};
            var hasErrors = false;

            if (!login.email || login.email === ''){
                errors.email = 'Email-ul este necesar';
                hasErrors = true;
            }
            if (!login.password || login.password === ''){
                errors.password = 'Parola este necesara';
                hasErrors = true;
            }

            if (hasErrors){
                return errors;
            } else {
                return null;
            }
        };

        var resetValues = function(login){
            login.user = undefined;
            login.password = undefined;
        }

    });