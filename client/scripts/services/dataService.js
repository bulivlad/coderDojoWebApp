/**
 * Created by Adina Paraschiv on 2/21/2017.
 */
'use strict';
angular.module('coderDojoTimisoara')
    .service('dataService', function($http){

        //Services that asks if users is authenticated (logged in)
        this.amIAuthenticated = function(){
            return $http({
                method: 'GET',
                url: '/user/' + keys.amIAuthenticated,
            });

        };

        //Service that returns the upcoming dojos
        this.getDojos = function(){
            return $http({
                method: 'get',
                url:'dojos/' + keys.getDojos
            });
        };

        //Service that returns the upcoming dojos in which users have registered to attend
        this.getAuthDojos = function(){
            return $http({
                method: 'get',
                url:'dojos/' + keys.getAuthDojos
            });
        };

        //Service that returns the users upcoming dojos
        this.getMyDojos = function(){
            console.log('dataServ gettingMyDojos')
            return $http({
                method: 'get',
                url:'dojos/' + keys.getMyDojos
            });
        };

        this.registerChildForDojo = function(data){
            return $http({
                method:'POST',
                url: 'dojos/' + keys.registerChildForDojo,
                data: data
            });
        };

        this.cancelChildRegisterForDojo = function(data){
            return $http({
                method:'POST',
                url: 'dojos/' + keys.cancelChildRegistryForDojo,
                data: data
            });
        }

        // Service that registers a user
        this.registerUser = function(user, callback){
            return $http({
                method: 'post',
                url: '/user/' + keys.register,
                data: {user: user}
            });

        };

        //Service that logs in a user
        this.loginUser = function(user){
            return $http({
                method: 'post',
                url: '/user/' + keys.login,
                data: user
            });
        };

        //Service that logs out an user
        this.logoutUser = function(user){
            return $http({
                method: 'get',
                url: '/user/' + keys.logout,
            });
        };

        this.editUser = function(user){
            return $http({
                method: 'POST',
                url: '/user/' + keys.editUser,
                data: {user: user}
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
