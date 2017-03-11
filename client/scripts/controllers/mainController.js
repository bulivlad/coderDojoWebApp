/**
 * Created by Adina Paraschiv on 2/21/2017.
 */

'use strict';


angular.module("coderDojoTimisoara")
    .controller("mainController", function($scope, dataService){


        $scope.amIAuthenticated = function(){
            dataService.amIAuthenticated(function(err, response){
                if (err){
                    if (err.status === 401){
                        console.log('You are not authenticated')
                    } else {
                        console.log('Problems communicating')
                    }
                } else {
                    if (response.data.user){
                        $scope.user = response.data.user;
                    } else {
                        console.log('Server responded with no user');
                    }
                }
            })
        };

        $scope.amIAuthenticated();


        $scope.pageInfo = generatePageInfo();

        $scope.getDespre = function(){
            dataService.getDespre(function(response){
                console.log('response', JSON.stringify(response.data));
                $rootScope.pageInfo.panelToDisplay[keys.despre] = true;
            });


        };


    });



function generatePageInfo(){
    let pageInfo = {};
    //Creating the panels value
    pageInfo.panelsContent = {};

    //Creating the panels to displayObject
    pageInfo.panelToDisplay = {};
    pageInfo.panelToDisplay[keys.despre] = false;

    return pageInfo;
}