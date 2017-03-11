/**
 * Created by Adina Paraschiv on 2/21/2017.
 */
'use strict';
angular.module('coderDojoTimisoara')
    .service('dataService', function($http){

        this.amIAuthenticated = function(callback){
            $http({
                method: 'GET',
                url: '/user/' + keys.amIAuthenticated,
            })
                .then(function(response){
                    callback(null, response);
                })
                .catch(function(err){
                    callback(err);
                });
        };


        //Function that registers a user
        this.registerUser = function(user, callback){
            $http({
                method: 'post',
                url: '/user/' + keys.register,
                data: {user: user}
            })
                .then(function(response){
                    callback(null, response);
                })
                .catch(function(){
                    callback(err);
                });
        };

        //Function that logs in a user
        this.loginUser = function(user, callback){
            console.log('loginUser');
            $http({
                method: 'post',
                url: '/user/' + keys.login,
                //data: {user: user}
                data: user
            })
                .then(function(response){
                    callback(null, response);
                })
                .catch(function(err){
                    callback(err);
                });
        };




        //Function that gets the despre values from the server
        this.getDespre = function(callback){
            console.log('get despre');
            $http({
                method: 'GET',
                url: '/' + keys.despre
            })
                .then(function(response){
                    callback(null, response);
                })
                .catch(function(err){
                    console.log('error communicating');
                    callback(err)
                });

        }
    });
