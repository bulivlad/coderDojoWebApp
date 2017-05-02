/**
 * Created by Adina Paraschiv on 3/8/2017.
 */


angular.module("coderDojoTimisoara")
    .controller('howMayIHelpController', function($scope, $rootScope, $location, dataService){
            dataService.getDespre(function(err, response){
                if (err){
                    if (err.status === 401){
                        $location.path('/' + keys.login);
                    } else {
                        console.log('err: ', err)
                    }
                } else {
                    $scope.content = response.data;
                    console.log();
                }
            })
    });