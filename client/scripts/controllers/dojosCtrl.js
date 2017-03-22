/**
 * Created by Adina Paraschiv on 2/21/2017.
 */

angular.module("coderDojoTimisoara")
    .controller("dojosCtrl", function($scope, $rootScope, $location, dataService, helperSvc, dojosService){
        $scope.getDojos = function(){
            if ($rootScope.user){
                //If the user is authenticated
                dataService.getAuthDojos()
                    .then(function(response){
                        if(response.errors){
                            //TODO same thing on the server
                        } else {
                            var dojos = response.data;
                            dojos.forEach(function (dojo) {
                                dojo.date = new Date(dojo.date);
                                dojo.date = helperSvc.prettyDate(dojo.date);
                            });
                            $scope.dojos = dojosService.prepareMyDojosForDisplay(dojos);
                        }
                    })
                    .catch(function(err){
                        console.log(err);
                    });
            } else {
                //If the user is not authenticated
                dataService.getDojos()
                    .then(function(response){
                        if(response.errors){
                            //TODO same thing on the server
                        } else {
                            var dojos = response.data;
                            dojos.forEach(function (dojo) {
                                dojo.date = new Date(dojo.date);
                                dojo.date = helperSvc.prettyDate(dojo.date);
                            });
                            $scope.dojos = dojos;
                        }
                    })
                    .catch(function(err){
                        console.log(err);
                    });
            }

        }

        $scope.registerChildForDojo = function(dojo, whichChild){
            if (!$rootScope.user){
                $rootScope.alert = keys.childRegisterAlert;
                helperSvc.determineAlertPosition();
            } else {
                console.log(JSON.stringify(dojo));
                //We verify if the current user has children
                var data = {dojoId: dojo._id};
                if ($rootScope.user.children){

                } else {
                    data.childName = $rootScope.user.firstName + ' ' + $rootScope.user.lastName;
                }

                dataService.registerChildForDojo(data, null)
                    .then(function(response){
                            if (response.data.error){
                                if (response.data.error === keys.childAlreadyRegisteredError){
                                    alert('Copilul este deja inregistrat');
                                } else if (response.data.error === keys.noMoreRoomInDojoError){
                                    alert('Nu mai este loc in dojo momentan');
                                }
                            } else if(response.data.dojo){
                                $scope.getDojos();
                            }
                    })
                    .catch(function(err){
                        if(err.status === 401){
                            $location.path('/' + keys.login);
                        } else if (err.status === 500){
                            alert('There was a problem, try again later');
                        } else {
                            console.log("Error registering user for dojo: " + err);
                        }
                    });
            }
        }

        //Method that determines if a child is registered in the current dojo
        $scope.isAnyChildRegistered = function(dojo){
            if (dojo.registered){
                for(var i = 0; i  < dojo.registered.length; i++){
                    if (dojo.registered[i]){
                        return true;
                    }
                }
            }
            return false;
        }

        //Getting the dojos when the page loads
        $scope.getDojos();
    });