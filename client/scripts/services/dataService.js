/**
 * Created by Adina Paraschiv on 2/21/2017.
 */
'use strict';
angular.module('coderDojoTimisoara')
    .service('dataService', function($http){

        //Services that asks if users is authenticated (logged in)
        this.getUserFromServer = function(){
            return $http({
                method: 'GET',
                url: '/user/' + keys.amIAuthenticatedUserRoute,
            });

        };

        //Service that asks for user's children
        this.getChildren = function(){
            return $http({
                method: 'GET',
                url: 'user/' + keys.getChildrenRoute
            });
        };

        //Service that asks for user's parents
        this.getUsersParents = function(){
            return $http({
                method: 'GET',
                url: 'user/' + keys.getUsersParentsRoute
            });
        };

        //Service that asks for user's parents
        this.getChildsParents = function(parents){
            return $http({
                method: 'POST',
                url: 'user/' + keys.getChildsParentsRoute,
                data: {parents: parents}
            });
        };

        //Service that returns all dojos
        this.getDojos = function(data){
            return $http({
                method: 'get',
                url:'dojos/' + keys.getDojosRoute,
                data: data
            });
        };

        //Service that returns the user's dojos
        this.getMyDojos = function(){
            return $http({
                method: 'get',
                url:'dojos/' + keys.getMyDojosRoute
            });
        };

        //Service that returns the user's child's dojos
        this.getMyChildsDojos = function(data){
            return $http({
                method: 'post',
                url:'dojos/' + keys.getMyChildsDojosRoute,
                data: data
            });
        };

        //Service that returns a dojo for an unauthenticated user
        this.getDojo = function(data){
            return $http({
                method: 'post',
                url:'dojos/' + keys.getDojoRoute,
                data: data
            });
        };

        //Service that returns a dojo for an Authenticated user
        this.getAuthDojo = function(data){
            return $http({
                method: 'post',
                url:'dojos/' + keys.getAuthDojoRoute,
                data: data
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
        this.registerUser = function(user){
            return $http({
                method: 'post',
                url: '/user/' + keys.register,
                data: {user: user}
            });

        };

        this.registerChild = function(childUser){
            return $http({
                method: 'POST',
                url: '/user/' + keys.registerChildRoute,
                data: {user: childUser}
            });
        }

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

        this.editUsersChild = function(usersChild){
            return $http({
                method: 'POST',
                url: '/user/' + keys.editUsersChild,
                data: {user: usersChild}
            });
        };


        this.getNotificationsForUser = function(){
            return $http({
                method: "GET",
                url: '/user/' + keys.getUsersNotificationsRoute
            });
        };

        this.getNotificationsForUsersChild = function(child){
            return $http({
                method: "POST",
                url: '/user/' + keys.getUsersChildNotificationsRoute,
                data: child
            });
        };

        this.inviteParent = function(invitation){
            return $http({
                method: 'POST',
                url: '/user/' + keys.inviteUserToBeParentRoute,
                data: invitation
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

        };

        this.deleteNotificationForUser = function(notification){
            return $http({
                method: 'POST',
                url: '/user/' + keys.deleteNotificationForUserRoute,
                data: notification
            });
        };

        this.deleteNotificationForUsersChild = function(notificationAndChild){
            return $http({
                method: 'POST',
                url: '/user/' + keys.deleteNotificationForUsersChildRoute,
                data: notificationAndChild
            });
        };

        this.acceptChildInvite = function(notification){
            return $http({
                method: 'POST',
                url: '/user/' + keys.acceptChildInviteRoute,
                data: notification
            });
        };

        this.addDojo = function(dojo){
            return $http({
                method: 'POST',
                url: '/dojos/' + keys.addDojoRoute,
                data: {dojo: dojo}
            });
        };

        this.editDojo = function(dojo){
            return $http({
                method: 'POST',
                url: '/dojos/' + keys.editDojoRoute,
                data: {dojo: dojo}
            });
        };

        this.becomeMemberOfDojo = function(data){
            return $http({
                method: 'POST',
                url: '/dojos/' + keys.becomeMemberOfDojoRoute,
                data: data
            });
        };

        this.leaveDojo = function(data){
            return $http({
                method: 'POST',
                url: '/dojos/' + keys.leaveDojoRoute,
                data: data
            });
        };

        this.getUsersForMember = function(data){
            return $http({
                method: 'POST',
                url: '/dojos/' + keys.getUsersForMember,
                data: data
            });
        };

        this.getDetailedUserForMember = function(data){
            return $http({
                method: 'POST',
                url: '/dojos/' + keys.getDetailedUserForMemberRoute,
                data: data
            });
        };

        this.acceptPendingMemberForDojo  = function(data){
            return $http({
                method: 'POST',
                url: '/dojos/' + keys.acceptPendingMemberRoute,
                data: data
            });
        };

        this.rejectPendingMemberForDojo  = function(data){
            return $http({
                method: 'POST',
                url: '/dojos/' + keys.rejectPendingMemberRoute,
                data: data
            });
        };

    });
