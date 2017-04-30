/**
 * Created by Adina Paraschiv on 2/21/2017.
 */

angular.module("coderDojoTimisoara")

    .controller('dojosCtrl', function($scope, $rootScope, $location, $compile, dataService, helperSvc, dojosService){
        var markers = [];
        $scope.dojoViewer = {views:{}, dojos:[]};

       var getDojosFromServerAndCreateMap = function(){
           dataService.getDojos()
               .then(function(response){
                   if(response.data.dojos){
                       $scope.dojoViewer.dojos = response.data.dojos;
                       createMapWithAllDojos();
                   }
               })
               .catch(function(err){
                   helperSvc.handlerCommunicationErrors(err, 'getDojosFromServerAndCreateMap- dojosCtrl', $scope);
               })
       };

        var getMyDojosFromServer = function(){
            dataService.getMyDojos()
                .then(function(response){
                    if(response.data.dojos){
                        $scope.dojoViewer.dojos = response.data.dojos;
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getMyDojosFromServer- dojosCtrl', $scope);
                })
        };


        //Method for injecting a google maps plugin for displaying dojos. Element name is the element where we are
        //going to inject the map (it's id). The flag forIndividualDojo is for making unclickable markers for single dojos
        var createMapWithDojos = function(dojos, elementName){
            var latLongTimisoara = new google.maps.LatLng(45.756818, 21.228600);

            $scope.mapProp = {
                center: latLongTimisoara,
                zoom: 12,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            mapObj = new google.maps.Map(document.getElementById(elementName), $scope.mapProp);
            google.maps.event.addListener(mapObj, 'click', function(){
                closeInfoWindows();
            })

            //Creating markers
            dojos.forEach(function(dojo){
                var markerLatLng =  new google.maps.LatLng(dojo.latitude, dojo.longitude);
                var marker = new google.maps.Marker({
                    position: markerLatLng,
                    map: mapObj,
                    name:dojo.name
                });
                var content = '<a class="info-window" ng-click="goToDojoAction(\'' + dojo.name + '\')">' + dojo.name + '</a>';
                var compiledContent = $compile(content)($scope);

                //for closing infoWindows
                markers.push(marker);

                var infoWindow = new google.maps.InfoWindow({
                    content:compiledContent[0]
                });
                marker.infoWindow = infoWindow;

                google.maps.event.addListener(marker,'click', (function(){
                    closeInfoWindows();
                    infoWindow.open(mapObj, marker);
                    })  );

            }); //end of for
        };

        //method that closes all info windows on map
        var closeInfoWindows = function(){
            markers.forEach(function(marker){
                marker.infoWindow.close();
            })
        };



       $scope.goToList = function(){
            $scope.setView(keys.viewList, [keys.showMapAndList]);
        };

        $scope.goToMap = function(){
            $scope.setView(keys.viewMap, [keys.showMapAndList]);
            createMapWithAllDojos();

        };

        $scope.setView = function(view, extraShowFlags){
            $scope.dojoViewer.views = {};
            $scope.dojoViewer.views[view] = true;
            if(extraShowFlags){
                extraShowFlags.forEach(function(flag){
                    $scope.dojoViewer.views[flag] = true;
                })
            }
        };

        //This sets a dojo in the viewDojo panel
        $scope.selectDojoAction = function(dojo){
            $scope.setToBeViewedDojoId(dojo._id);
            $location.path('/' + keys.getDojoRoute);
        };


        // we need the delay because otherwise the element would not be drawn on time and an exception raised
        // because the map did not have an element to inject itself onto
        var createMapWithAllDojos = function(){
            setTimeout(function(){
                createMapWithDojos($scope.dojoViewer.dojos, 'dojo-map');
            }, 200);
        };

        //This method is used when selecting a dojo from the map (we only know its name)
        $scope.goToDojoAction = function(dojoName){
            for(var i = 0; i < $scope.dojoViewer.dojos.length; i++){
                var dojo = $scope.dojoViewer.dojos[i];
                if(dojo.name === dojoName){
                    $scope.selectDojoAction(dojo);
                    return;
                }
            }
        };

        //Method for informing controllers that are children of this controller where they are
        $scope.whereAmI = function(){
            return 'dojosCtrl';
        };

        $scope.initializeDojosCtrl = function(){
            //If we are showing only the users's dojos
            if(isMyDojosView()){
                if($scope.isUserLoggedIn()){
                    $scope.setView(keys.viewList);
                    getMyDojosFromServer();
                }
                //If the user is not logged in and has somehow received the option to view my dojos, go the the default page
                else {
                    $location.path('/' + keys.despre);
                }
            }
            //If we are in the search for dojo route
            else if (isSearchForDojoView()){
                //The default view is view map
                $scope.setView(keys.viewMap, [keys.showMapAndList]);
                getDojosFromServerAndCreateMap();
            }
        };

        var isSearchForDojoView = function(){
            return $location.path() === ('/' +  keys.cautaUnDojo);
        };

        var isMyDojosView = function(){
            return $location.path() === ('/' +  keys.getMyDojos);
        };




        $scope.initializeDojosCtrl();

    })//End dojosCtrl
    .controller('dojoBubbleCtrl', function($scope, $location, dataService, helperSvc){
        $scope.bubbleDojos = [];

        //Method that retrieves a user's dojos from the server
        var getUsersDojosFromServer = function(){
            dataService.getMyDojos()
                .then(function(response){
                    if(response.data.dojos){
                        $scope.bubbleDojos = response.data.dojos;
                    } else {
                        console.log('No dojos in answer error');
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getUsersDojos - editProfilesCtrl', $scope);
                })
        };

        var initializeDojoBubbleCtrl = function(userId){
           getUsersDojosFromServer();
        };

        initializeDojoBubbleCtrl();

        //This event listener is used when a user is changed, to get the dojos
        $scope.$on('userChange', function(event, userId){
            initializeDojoBubbleCtrl(userId);
        });


        //This sets a dojo in the viewDojo panel
        $scope.selectDojoAction = function(dojo){
            $scope.setToBeViewedDojoId(dojo._id);
            $location.path('/' + keys.getDojoRoute);
        };
    });