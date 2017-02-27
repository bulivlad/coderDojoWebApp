/**
 * Created by Adina Paraschiv on 2/21/2017.
 */

'use strict';


angular.module("coderDojoTimisoara")
    .controller("mainController", function($scope, $rootScope, dataService){
            $rootScope.pageInfo = generatePageInfo();

            $scope.getDespre = function(){
                    dataService.getDespre(function(response){
                            console.log('response', JSON.stringify(response.data));
                            $rootScope.pageInfo.panelToDisplay[keys.despre] = true;
                    });


            };


    })



function generatePageInfo(){
        let pageInfo = {}
        //Creating the panels value
        pageInfo.panelsContent = {};

        //Creating the panels to displayObject
        pageInfo.panelToDisplay = {};
        pageInfo.panelToDisplay[keys.despre] = false;

        return pageInfo;
}