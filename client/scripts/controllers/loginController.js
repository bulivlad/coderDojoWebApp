/**
 * Created by Adina Paraschiv on 3/1/2017.
 */

angular.module("coderDojoTimisoara")
    .controller('loginController', function($scope, $rootScope, $location, dataService){
        $scope.login = {};
        $scope.login.email = undefined;
        $scope.login.password = undefined;

        $scope.loginUser = function(){
            //We reset the justRegistered flag
            $rootScope.justRegistered = undefined;
            //We validate the fields
            var errors = validateLoginFields($scope.login);
            if (errors){
                //IF there are errors we set them in the scope for the html
                $scope.login.errors = errors;
            } else {
                var user = {
                    email:$scope.login.email,
                    password: $scope.login.password
                };
                //If there are no errors we send the user to the server for logging in
                dataService.loginUser(user)
                    .then(function(response){
                        if(response.data.errors){
                            //if there are errors we set them to the scope
                            $scope.login.errors = response.data.errors;
                        }else if (response.data.success){
                            // If we receive a success message from the server we go the the default page and get the
                            // user from the server.
                            $location.path('/' + keys.despre);
                            //We get the user from the server (and the user's notifications)
                            $scope.getUserFromServer($scope.getNewNotificationsCount);
                        }
                    })
                    .catch(function(err){
                        if(err.status === 401 || err.status === 400){
                            $scope.login.errors = {email:'Email-ul sau parola nu sunt corecte'};
                        } else if (err.status === -1){
                            $scope.login.errors = {email:'Verificati conexiunea la internet'};
                        } else {
                            $scope.login.errors = {email:'Probleme de comunicare cu serverul'};
                        }
                        console.log("there was an error: ", err);
                    });
            }

        };

        var validateLoginFields = function(user){
            var errors = {};
            var hasErrors = false;

            if (!user.email || user.email === ''){
                errors.email = 'Email-ul este necesar';
                hasErrors = true;
            }
            if (!user.password || user.password === ''){
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