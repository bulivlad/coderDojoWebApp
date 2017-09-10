/**
 * Created by catap_000 on 7/8/2017.
 */
angular.module("coderDojoTimisoara")
    .controller("specialEventCtrl", function($scope, $rootScope, dataService, helperSvc){
        $scope.views = {};
        $scope.isParentCtrlViewSpecialEventCtrl = true;

        $scope.isCurrentView  = function(view){
           return $scope.views[view];
        };

        $scope.setView = function(view){
            $scope.views = {};
            $scope.views[view] = true;
        };

        $scope.getSpecialEventDate = function(specialEvent){
            return helperSvc.getEventDate(specialEvent, true);
        };

        $scope.goBackAction = function(){
          if($scope.isCurrentView(keys.viewSpecialEvent)) {
              //If special events will be available from more location, use the getSpecialEventView object to know were
              // to go.
                $scope.goToEvents();
          } else {
              //This means we go from editing mode to view mode
              initializeSpecialEventCtrl();
          }
        };

        var createMapWithSpecialEvent = function(specialEvent){
            setTimeout(function(){
                drawMap(specialEvent, 'special-event-map');
            }, 300)
        };

        //Method for injecting a google maps plugin for displaying a special event location. Element name is the element
        // where we are going to inject the map (it's id).
        var drawMap = function(specialEvent, elementName){
            var latLongDojo = new google.maps.LatLng(specialEvent.latitude, specialEvent.longitude);

            $scope.mapProp = {
                center: latLongDojo,
                zoom: 12,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            var mapObj = new google.maps.Map(document.getElementById(elementName), $scope.mapProp);

            //Creating markers
            var markerLatLng =  latLongDojo;
            var marker = new google.maps.Marker({
                position: markerLatLng,
                map: mapObj,
                name:specialEvent.name
            });

        };

        $scope.editSpecialEventAction = function(){
            $scope.setView(keys.editSpecialEvent);
        };

        $scope.getBackgroundUrlForSpecialEventPhoto = function(specialEvent){
            return helperSvc.getBackgroundUrlForSpecialEventPhoto(specialEvent);
        };

        var initializeSpecialEventCtrl = function(){
            var specialEventView = $scope.getSpecialEventView();
            //An event view object must exist for us to know which event to display
            if(specialEventView){
                dataService.getSpecialEvent({specialEventId: specialEventView.specialEventId})
                    .then(function(response){
                        if(response.data.specialEvent){
                            $scope.specialEvent = response.data.specialEvent;
                            $scope.setView(keys.viewSpecialEvent);
                            createMapWithSpecialEvent($scope.specialEvent);
                        }
                    })
                    .catch(function(err){
                        helperSvc.handlerCommunicationErrors(err, 'initializeSpecialEventCtrl() specialEventCtrl', $scope);
                    })
            } else {
                //An error has occurred, go to view despre
                $scope.goToDespre();
            }
        };

        initializeSpecialEventCtrl();
    });
