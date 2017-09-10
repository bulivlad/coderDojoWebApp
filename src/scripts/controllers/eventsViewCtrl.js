/**
 * Created by catap_000 on 7/4/2017.
 */

angular.module("coderDojoTimisoara")
    .controller("eventsViewCtrl", function($scope, $rootScope, dataService, helperSvc){
        //This controller is used to display the events (evenimente) views, that will contain special events, and current
        // dojo events.

        //THis is used by child scope to identify the parent controller.
        $scope.isParentCtrlEventsViewCtrl = true;
        $scope.views = {viewSpecialEvents: true};

        $scope.viewSpecialEvents = function(){
            $scope.views.viewDojoEvents = false;
            $scope.views.viewSpecialEvents = true;
            initializeEventsViewCtrl();
        };

        $scope.viewDojoEvents = function(){
            $scope.views.viewSpecialEvents = false;
            $scope.views.viewDojoEvents = true;
        };

        $scope.viewSpecialEventAction = function(specialEvent){
            $scope.setSpecialEventView(specialEvent._id, keys.eventsLocation);
            $scope.goToViewSpecialEvent();
        };

        $scope.getBackgroundUrlForSpecialEventPhoto = function(specialEvent){
            return helperSvc.getBackgroundUrlForSpecialEventPhoto(specialEvent);
        };

        $scope.getSpecialEventDate = function(specialEvent){
          return helperSvc.getEventDate(specialEvent, true);
        };

        var initializeEventsViewCtrl = function(){
            dataService.getCurrentSpecialEvents()
                .then(function(response){
                    if(response.data.specialEvents){
                        $scope.specialEvents = response.data.specialEvents;
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'initializeEventsViewCtrl() - eventsViewCtrl', $scope);
                })
        };


        initializeEventsViewCtrl();


    });