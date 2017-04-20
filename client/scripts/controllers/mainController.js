/**
 * Created by Adina Paraschiv on 2/21/2017.
 */

'use strict';


angular.module("coderDojoTimisoara")
    .controller("mainController", function($scope, $rootScope, $location, dataService, helperSvc){
        //Copying the keys to the scope for user in the view
        $scope.keys = keys;
        $scope.getUserFromServer = function(callback){
            dataService.getUserFromServer()
                .then(function(response){
                    if (response.data.user){
                        $rootScope.user = response.data.user;
                        $rootScope.user.birthDate = new Date($rootScope.user.birthDate);
                        if(callback){
                            callback(null);
                        }
                    } else {
                        console.log('Server responded with no user');
                    }
                })
                .catch(function(err){
                    if (err.status === 401){
                        //If not authorized, we must delete the current user
                        $rootScope.user = undefined;
                        console.log('You are not authenticated')
                    } else {
                        console.log('Problems communicating')
                    }
                    if(callback){
                        callback(err);
                    }

                });
        };

        $scope.setAlert = function(alertType, alertMessage){
            $rootScope.alert = alertType;
            $rootScope.alertMessage = alertMessage;
            helperSvc.scrollToTop();
        };


        $scope.getPrettyDate = function(date){
            return helperSvc.prettyDate(date, false);
        }



        $rootScope.deleteUser = function(methodName){
            $rootScope.user = undefined;
            console.log('User deleted by: ' + methodName);
        }

        $scope.deleteUser = $rootScope.deleteUser;

        $scope.getUserFromServer();
        $scope.isError = function(){
            $rootScope.alert === 'savingUserErrorAlert'
        }

        $scope.setCorrectPathForWideNavigation = function(){
            var currentPath = $location.path();
            if(currentPath === '/' + keys.despre){
                $scope.navLink = 'Despre';
            } else  if(currentPath === '/' + keys.getDojos){
                $scope.navLink = 'Inscriere Saptamanala';
            }
        }

        $scope.setCorrectPathForWideNavigation();

        $scope.goToLogin = function(){
            $location.path('/' + keys.login);
            $rootScope.alert = undefined;
        };

        $scope.goToRegister = function(){
            $location.path('/' + keys.register);
            $rootScope.alert = undefined;
        };

        $scope.resetAlerts = function(){
                $rootScope.alert = undefined;
                $rootScope.alertMessage = undefined;
        };

        $scope.isUserLoggedIn = function(){
            if($rootScope.user){
                return true;
            }
        }

        $scope.getDespre = function(){
            dataService.getDespre(function(response){
                console.log('response', JSON.stringify(response.data));
                $rootScope.pageInfo.panelToDisplay[keys.despre] = true;
            });


        };




    });



