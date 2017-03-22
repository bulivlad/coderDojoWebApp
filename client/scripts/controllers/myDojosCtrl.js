/**
 * Created by Adina Paraschiv on 2/21/2017.
 */

angular.module("coderDojoTimisoara")
    .controller("myDojosCtrl", function($scope, $rootScope, $location, dataService, helperSvc, dojosService){
        $scope.getMyDojos = function(){
            console.log('gettingMyDojos');
            dataService.getMyDojos()
                .then(function(response){
                    if(response.data.errors){
                        //TODO same thing on the server
                    } else {
                        if (response.data){
                            var dojos = response.data;
                            dojos.forEach(function(dojo){
                                dojo.date = new Date(dojo.date);
                                dojo.date = helperSvc.prettyDate(dojo.date, true);
                            });
                            $scope.dojos = dojosService.prepareMyDojosForDisplay(dojos);
                        }
                    }
                })
                .catch(function(err){
                    if (err.status === 401){
                        $location.path('/' + keys.despre);
                    } else {
                        console.log(err);
                    }
                });


        };

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
        };

        $scope.cancelChildRegisterForDojo = function(dojo) {
            if (confirm('Ești sigur ca vrei sa renunti la inscrierea lui ' + dojo.registered[0].childName)) {
                //Getting the dojo id and the registed child to be removed
                var data = {dojoId: dojo._id, child: dojo.registered[0]};
                dataService.cancelChildRegisterForDojo(data)
                    .then(function (response) {
                        if (response.data.errors) {
                            if(response.data.errors === keys.parentEmailNotMatchError){
                                alert('Utilizatorul logat nu corespunde cu cerinta.')
                            } else {
                                console.log(response.data.errors);
                            }
                        } else if (response.data.dojo) {
                            $scope.getMyDojos();
                        }
                    })
            }
        };

        $scope.getMyDojos();
        console.log();


    });
