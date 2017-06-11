/**
 * Created by Adina Paraschiv on 2/21/2017.
 */

'use strict';


angular.module("coderDojoTimisoara")
    .controller("mainController", function($scope, $rootScope, $route,  $location, dataService, helperSvc){
        //Copying the keys to the scope for user in the view
        $scope.keys = keys;
        $scope.getUserFromServer = function(callback){
            dataService.getUserFromServer()
                .then(function(response){
                    if (response.data.user){
                        $rootScope.user = response.data.user;
                        $rootScope.user.birthDate = new Date($rootScope.user.birthDate);
                        if(callback){
                            callback(null);
                        }
                    } else {
                        console.log('Server responded with no user');
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getUserFromServer', $scope);
                    callback(err);
                });
        };

        $scope.getNewNotificationsCount = function(err){
            if(!err && $scope.isUserLoggedIn()){
                dataService.getNewNotificationsCount()
                    .then(function(response){
                        if(response.data[keys.newNotificationCount]){
                            $scope[keys.newNotificationCount] = response.data[keys.newNotificationCount];
                        }
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err, 'getNewNotificationsCount', $scope);
                    })
            }
        };

        $scope.resetNewNotificationCount = function(){
            $scope.newNotificationCount = 0;
        };

        //Method for displaying a modal alert
        $scope.setAlert = function(alertType, alertMessage){
            $scope.resetAlerts();
            $rootScope.alert = alertType;
            $rootScope.alertMessage = alertMessage;
        };

        //Method for displaying a modal information about a topic
        $scope.setInformation = function(infoType){
            $scope.resetInformation();
            $rootScope.information = infoType;
        };

        $scope.resetInformation = function(){
            $rootScope.information = undefined;
        };

        $scope.getPrettyDate = function(date){
            return helperSvc.prettyDate(date, false);
        };

        $rootScope.deleteUser = function(methodName){
            $rootScope.user = undefined;
            console.log('User deleted by: ' + methodName);
        };

        $scope.isUserLoggedIn = function(){
            if($rootScope.user){
                return true;
            }
        };

        $scope.deleteUser = $rootScope.deleteUser;


        $scope.getUserFromServer($scope.getNewNotificationsCount);

        //Starting the get new Notifications interval
        setInterval(function(){
            $scope.getNewNotificationsCount(null);
        }, 10000);

        $scope.setCorrectPathForWideNavigation = function(){
            var currentPath = $location.path();
            if(currentPath === '/' + keys.despre){
                $scope.navLink = 'Despre';
            } else  if(currentPath === '/' + keys.getDojosRoute){
                $scope.navLink = 'Inscriere Saptamanala';
            }
        };

        $scope.setCorrectPathForWideNavigation();


        $scope.goToLogin = function(){
            $location.path('/' + keys.login);
        };

        $scope.goToViewUserProfile = function(){
            if($location.path() === '/'+ keys.myProfile){
                $route.reload()
            } else {
                $location.path('/' + keys.myProfile);
            }
        };

        $scope.goToLoginAndResetAlerts = function(){
            $scope.goToLogin();
            $rootScope.alert = undefined;
        };

        $scope.goToRegister = function(){
            $location.path('/' + keys.register);
        };

        $scope.goToRegisterAndResetAlerts = function(){
            $scope.goToRegister();
            $rootScope.alert = undefined;
        };

        $scope.goToDespre = function(){
            $location.path('/' + keys.despre);
        };

        $scope.goToViewEvent = function(){
            $location.path('/' + keys.viewEventLocation);
        };

        $scope.goToViewDojo = function(){
            $location.path('/' + keys.getDojoRoute);
        };

        //This sets the eventId for the event to be downloaded, and the location where the event was accessed,
        // to be used when going back.
        $scope.setEventView = function(eventId, previousLocation){
            $scope.eventView = {eventId: eventId, previousLocation: previousLocation};
        };

        $scope.getEventView = function(){
            return $scope.eventView;
        };

        $scope.resetAlerts = function(){
                $rootScope.alert = undefined;
                $rootScope.alertMessage = undefined;
        };

        $scope.isUserLoggedIn = function(){
            if($rootScope.user){
                return true;
            }
        };

        //Method for setting the dojo to be viewed
        $scope.setToBeViewedDojoId = function(dojoId){
            $scope.toBeViewedDojoId = dojoId;
        };

        //Method for getting the current dojo to be viewed
        $scope.getToBeViewedDojoId = function(){
            return $scope.toBeViewedDojoId;
        };

        $scope.showUserMenuDropDown = function(event){
            event.stopPropagation();
            $('.user-menu-dropdown').show();
            $('#user-menu-header').css('background-color', 'white').css('border-left', '3px solid #e3e3e3');
        };

        $scope.initiateMainController = function(){
            hideMenusWhenPageClicked();
        };

        //Method for going to a page in the site
        $scope.goToPage = function(page){
            $location.path('/' + page);
        };

        //Method for hiding menus that should be hidden when the page is clicked (the event propagation is stopped to cancel
        //hiding the menu inadvertently
        var hideMenusWhenPageClicked = function(){
            $(document).click(function(){
                hideUserMenu();
            });
        };

        var hideUserMenu = function(){
            if (!($(".user-menu-dropdown").css('display') === 'none')){
                $(".user-menu-dropdown").hide().css('background-color:white');
                $('#user-menu-header').css('background-color', '#ededed').css('border-left', '3px solid #ededed');
            }
        };

        $scope.addEmptyEvent = function(events){
            events.push({
                sessions:[{tickets:[{}]}]
            });
        };

        $scope.addTicket = function(tickets){
            tickets.push({});
        };

        $scope.addSession = function(sessions){
            sessions.push({tickets:[{}]});
        };

        $scope.deleteSession = function(sessions, index){
            if (sessions.length > 1){
                sessions.splice(index, 1);
            } else {
                sessions.pop();
                sessions.push({tickets:[{}]});
            }
        };

        $scope.deleteTicket = function(tickets, index){
            if (tickets.length > 1){
                tickets.splice(index, 1);
            } else {
                tickets.pop();
                tickets.push({});
            }
        };

        $scope.isLastItemInArray = function(array, index){
            return (array.length - 1) === index;
        };

        $scope.isCurrentView = function(view){
          return false;
        };

        $scope.eventIsRecurrent = function(eventType){
          return eventType === keys.eventTypes[0];
        };

        $scope.eventIsUnique = function(eventType){
            return eventType === keys.eventTypes[1];
        };

        //Method for setting the view that selected a dojo (ex cauta un dojo view). This info is used when going back
        //from a dojo, to know to which view to go
        $scope.setDojoSelector = function(dojoSelector){
          $scope.dojoSelector = dojoSelector;
        };

        $scope.getDojoSelector = function(){
          return $scope.dojoSelector;
        };

        $scope.showNotAuthorizedError = function(){
            $location.path('/' + keys.despre);
            $scope.setAlert(keys.errorAlert, 'Nu esti autorizat pentru aceasta operatiune!');
        };

        $scope.initiateMainController();
    });



