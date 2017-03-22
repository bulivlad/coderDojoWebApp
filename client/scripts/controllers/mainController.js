/**
 * Created by Adina Paraschiv on 2/21/2017.
 */

'use strict';


angular.module("coderDojoTimisoara")
    .controller("mainController", function($scope, $rootScope, $location, dataService){
        $scope.amIAuthenticated = function(){
            dataService.amIAuthenticated()
                .then(function(response){
                    if (response.data.user){
                        $rootScope.user = response.data.user;
                        $rootScope.user.birthDate = new Date($rootScope.user.birthDate);
                    } else {
                        console.log('Server responded with no user');
                    }
                })
                .catch(function(err){
                    if (err.status === 401){
                        console.log('You are not authenticated')
                    } else {
                        console.log('Problems communicating')
                    }
                });
        };

        $scope.amIAuthenticated();

        $scope.setCorrectPathForWideNavigation = function(){
            var currentPath = $location.path();
            if(currentPath === '/' + keys.despre){
                $scope.navLink = 'Despre';
            } else  if(currentPath === '/' + keys.getDojos){
                $scope.navLink = 'Inscriere Saptamanala';
            }
        }

        $scope.setCorrectPathForWideNavigation();

        $scope.isChildRegisterAlert = function(){
            return $rootScope.alert === keys.childRegisterAlert;
        };

        $scope.isUserModifiedAlert = function(){
            return $rootScope.alert === keys.userModifiedAlert;
        };

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
        }

        $scope.getDespre = function(){
            dataService.getDespre(function(response){
                console.log('response', JSON.stringify(response.data));
                $rootScope.pageInfo.panelToDisplay[keys.despre] = true;
            });


        };


    });



