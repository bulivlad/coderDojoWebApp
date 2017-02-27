/**
 * Created by Adina Paraschiv on 2/21/2017.
 */
'use strict';
angular.module('coderDojoTimisoara')
    .service('dataService', function($http){

        //Function that gets the despre values from the server
        this.getDespre = function(callback){
            $http({
                method: 'GET',
                url: '/' + keys.despre
            })
                .then(function(response){
                    callback(response);
                })
                .catch(function(){

                });

        }
    });
