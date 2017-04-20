/**
 * Created by Adina Paraschiv on 2/21/2017.
 */

angular.module("coderDojoTimisoara")
    .controller("dojosCtrl", function($scope, $rootScope, $location, dataService, helperSvc, dojosService){
        $scope.getDojos = function(){
            if ($rootScope.user){
                //If the user is authenticated
                dataService.getAuthDojos()
                    .then(function(response){
                        if(response.errors){
                            //TODO same thing on the server
                        } else {
                            var dojos = response.data;
                            dojos.forEach(function (dojo) {
                                dojo.date = new Date(dojo.date);
                                dojo.date = helperSvc.prettyDate(dojo.date);
                            });
                            $scope.dojos = dojosService.prepareMyDojosForDisplay(dojos);
                        }
                    })
                    .catch(function(err){
                        console.log(err);
                    });
            } else {
                //If the user is not authenticated
                dataService.getDojos()
                    .then(function(response){
                        if(response.errors){
                            //TODO same thing on the server
                        } else {
                            var dojos = response.data;
                            dojos.forEach(function (dojo) {
                                dojo.date = new Date(dojo.date);
                                dojo.date = helperSvc.prettyDate(dojo.date);
                            });
                            $scope.dojos = dojos;
                        }
                    })
                    .catch(function(err){
                        console.log(err);
                    });
            }

        }

        $scope.registerChildForDojo = function(dojo, whichChild){
            if (!$rootScope.user){
                $rootScope.alert = keys.childRegisterAlert;
                helperSvc.determineAlertPosition();
            } else {
                console.log(JSON.stringify(dojo));
                //We verify if the current user has children
                var data = {dojoId: dojo._id};
                if ($rootScope.user.children){

                } else {
                    data.childName = $rootScope.user.firstName + ' ' + $rootScope.user.lastName;
                }

                dataService.registerChildForDojo(data, null)
                    .then(function(response){
                        if (response.data.error){
                            if (response.data.error === keys.childAlreadyRegisteredError){
                                alert('Copilul este deja inregistrat');
                            } else if (response.data.error === keys.noMoreRoomInDojoError){
                                alert('Nu mai este loc in dojo momentan');
                            }
                        } else if(response.data.dojo){
                            $scope.getDojos();
                        }
                    })
                    .catch(function(err){
                        if(err.status === 401){
                            $location.path('/' + keys.login);
                        } else if (err.status === 500){
                            alert('There was a problem, try again later');
                        } else {
                            console.log("Error registering user for dojo: " + err);
                        }
                    });
            }
        }

        //Method that determines if a child is registered in the current dojo
        $scope.isAnyChildRegistered = function(dojo){
            if (dojo.registered){
                for(var i = 0; i  < dojo.registered.length; i++){
                    if (dojo.registered[i]){
                        return true;
                    }
                }
            }
            return false;
        }

        //Getting the dojos when the page loads
        $scope.getDojos();
    })
    .controller('addDojoCtrl', function($scope, $rootScope, $location, dataService, helperSvc){
        $scope.errors = {};
        $scope.dojo = {};
        $scope.addDojo = function(){
            var errors = validateDojoFields($scope.dojo);
            if(errors){
                $scope.errors = errors;
            } else {
                dataService.addDojo($scope.dojo)
                    .then(function(response){
                        if(response.data.errors === keys.notAuthorizedError){
                            $location.path('/' + keys.despre);
                            $scope.setAlert(keys.errorAlert, 'Nu esti autorizat pentru aceasta operatiune!');
                        } else if (response.data.success){
                            $location.path('/' + keys.cautaUnDojo);
                            $scope.setAlert(keys.infoAlert, 'Dojo creeat cu succes!');
                        }
                    })
                    .catch(function(err){
                        //TODO handler errros
                        console.log(err);
                    })
            }
        }

        var validateDojoFields = function(dojo){
            var errors = {};
            var hasErrors = false;

            if(!dojo.name || dojo.name === ''){
                hasErrors = true;
                errors.name = 'Dojo-ul trebuie sa aibe nume';
            }

            if(!dojo.address || dojo.address === ''){
                hasErrors = true;
                errors.address = 'Dojo-ul trebuie sa aibe adresa';
            }

            if(!dojo.latitude || dojo.latitude === ''){
                hasErrors = true;
                errors.latitude = 'Dojo-ul trebuie sa aibe latitudine';
            }

            if(!dojo.longitude || dojo.longitude === ''){
                hasErrors = true;
                errors.longitude = 'Dojo-ul trebuie sa aibe longitudine';
            }

            if(!dojo.email || dojo.email === ''){
                hasErrors = true;
                errors.email = 'Dojo-ul trebuie sa aibe email';
            }

            if(!dojo.orar){
                hasErrors = true;
                errors.orar = 'Dojo-ul trebuie sa aibe orar';
            }

            if(!dojo.requirements || dojo.requirements === ''){
                hasErrors = true;
                errors.requirements = 'Dojo-ul trebuie sa aibe cerinte scrise cu enter';
            }


            if (hasErrors){
                return errors;
            } else {
                return null;
            }
        }
    })
    .controller('searchForDojosCtrl', function($scope, $rootScope, $location, $compile, dataService, helperSvc){
        $scope.dojos = [];
        var markers = [];
        $scope.dojoViewer = {views:{}, dojos:[]};
        $scope.localKeys = {
            showBackButton: 'showBackButton',
            showMapAndList: 'showMapAndList'
        }


       var getNotLoggedInDojosFromServer = function(){
           dataService.getDojos()
               .then(function(response){
                   if(response.data.dojos){
                       $scope.dojoViewer.dojos = response.data.dojos;
                       createMapWithDojos($scope.dojoViewer.dojos, 'dojo-map', false);
                   }
               })
               .catch(function(err){
                   console.log(err);
               })
       };

        var getLoggedInDojosFromServerAndCreateDojoMap = function(){
            dataService.getAuthDojos()
                .then(function(response){
                    if(response.data.dojos){
                        $scope.dojoViewer.dojos = response.data.dojos;
                        createMapWithDojos($scope.dojoViewer.dojos, 'dojo-map', false);
                    }
                })
                .catch(function(err){
                    console.log(err);
                })
        };

        //Method for injecting a google maps plugin for displaying dojos. Element name is the element where we are
        //going to inject the map (it's id). The flag forIndividualDojo is for making unclickable markers for single dojos
        var createMapWithDojos = function(dojos, elementName, forIndividualDojo){
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
                })
                if (!forIndividualDojo){
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
                }

            }); //end of for
        };

        //method for joining dojo
        $scope.joinDojoAction = function(){
            if($scope.isUserLoggedIn()){
                $('body').css('overflow', 'hidden');
                $scope.dojoViewer.views.showJoin = true;
                if(helperSvc.isAgeGreaterThen18($scope.user.birthDate)){
                    $scope.dojoViewer.views.isAdult = true;
                }
            } else {
                $scope.goToLogin();
            }
        };

        $scope.leaveDojoAction = function(){
            var currentDojoId = $scope.dojoViewer.dojo._id;
            dataService.leaveDojo({dojoId: currentDojoId})
                .then(function(response){
                    if(response.data.success){
                        //If the leaving of the dojo has been successful, we reload the dojos and set the current
                        // dojo as the loaded dojo
                        dataService.getAuthDojos()
                            .then(function(response){
                                if(response.data.dojos){
                                    $scope.dojoViewer.dojos = response.data.dojos;
                                    $scope.dojoViewer.dojo = getDojoFromDojos(currentDojoId, $scope.dojoViewer.dojos);
                                }
                            })
                            .catch(function(err){
                                $scope.initialize();
                                console.log(err);
                            })
                    }
                })
        };

        $scope.closeJoinModal = function(){
            $scope.dojoViewer.views.showJoin = false;
            $('body').css('overflow', 'auto');
        }

        $scope.goToDojo = function(dojo){
            console.log('dojo', dojo);
        };

        $scope.goToList = function(){
            $scope.setView(keys.viewList, [$scope.localKeys.showMapAndList]);
        };

        $scope.goToMap = function(){
            $scope.setView(keys.viewMap, [$scope.localKeys.showMapAndList]);
            // we need the delay because otherwise the element would not be drawn on time and an exception raised
            // because the map did not have an element to inject itself onto
            setTimeout(function(){
                createMapWithDojos($scope.dojoViewer.dojos, 'dojo-map', false);

            }, 200);
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
            $scope.setView(keys.viewDojo, [$scope.localKeys.showBackButton]);
            $scope.dojoViewer.dojo = dojo;
            setTimeout(function(){
                createMapWithDojos([$scope.dojoViewer.dojo], 'dojo-map-single-dojo', true);

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

        //Method for navigating back in the dojo view
        $scope.goBackAction = function(){
            if(isCurrentView(keys.viewDojo)){
                $scope.initialize();
            } else if(isCurrentView(keys.viewMembers)){
                $scope.setView(keys.viewDojo, [$scope.localKeys.showBackButton]);
            }
        };

        // Method to determine if the current view is thisView
        var isCurrentView = function(thisView){
            return $scope.dojoViewer.views[thisView];
        };

        //method that closes all info windows on map
        var closeInfoWindows = function(){
            markers.forEach(function(marker){
                marker.infoWindow.close();
            })
        };

        $scope.createSchedule = function(rawSchedules){
            var ret = '';

            if(rawSchedules){
                rawSchedules.forEach(function(rawSchedule){
                    var startHour = rawSchedule.startHour + '';
                    startHour = startHour.length == 1 ? '0' + startHour : startHour;

                    var endHour = rawSchedule.endHour + '';
                    endHour = endHour.length == 1 ? '0' + endHour : endHour;

                    var startMinute = rawSchedule.startMinute + '';
                    startMinute = startMinute.length == 1 ? '0' + startMinute : startMinute;

                    var endMinute = rawSchedule.endMinute + '';
                    endMinute = endMinute.length == 1 ? '0' + endMinute : endMinute;

                    var schedule = 'In fiecare ' +  rawSchedule.day + ' de la ' + startHour + ':' + startMinute +
                        ' la ' + endHour + ':' + endMinute;

                    ret += schedule;
                    ret += '\n';
                });
            }

            return ret;
        };

        //Method for sernding request to server to become a member of a dojo
       $scope.becomeMemberOfDojo = function($event, whatMember){
            $event.stopPropagation();
           var currentDojoId = $scope.dojoViewer.dojo._id;
            dataService.becomeMemberOfDojo({dojoId: currentDojoId, whatMember: whatMember})
                .then(function(response){
                    if(response.data.success){
                        //If the request for membership has been sent successfully, we refresh the dojos
                        // from the server (with the current user joined or pending)

                        dataService.getAuthDojos()
                            .then(function(response){
                                if(response.data.dojos){
                                    $scope.dojoViewer.dojos = response.data.dojos;
                                    $scope.dojoViewer.dojo = getDojoFromDojos(currentDojoId, $scope.dojoViewer.dojos);
                                }
                                $scope.closeJoinModal();
                            })
                            .catch(function(err){
                                $scope.closeJoinModal();
                                $scope.initialize();
                                console.log(err);
                            })
                    } else {
                        $scope.closeJoinModal();
                        if(response.data.errors === keys.userAlreadyJoinedDojoError){
                            $scope.setAlert(keys.infoAlert, 'Utilizatorul deja face parte din dojo.');
                        } else {
                            $scope.setAlert(keys.errorAlert, 'Probleme de comunicare cu serverul, te rugăm să mai încerci.');
                        }

                    }

                })
                .catch(function(err){
                    if(err.status === 500){
                        $scope.setAlert(keys.errorAlert, 'Probleme de comunicare cu serverul, te rugăm să mai încerci.');
                    } else if (err.status === 401){
                        $scope.setAlert(keys.errorAlert, 'Nu esti autorizat pentru aceasta operatiune!');
                    }

                    $scope.closeJoinModal();

                })

        };

        //Method for getting a dojo from a list of dojos
        var getDojoFromDojos = function(dojoId, dojos){
            for(var i = 0; i < dojos.length; i++){
                var curDojo = dojos[i];
                if(curDojo._id === dojoId){
                    return curDojo;
                }
            }
        };

        $scope.goToViewMembers = function(){
            $scope.setView(keys.viewMembers, [$scope.localKeys.showBackButton]);
        };

        $scope.initialize = function(){
            //The default view is view map
            $scope.setView(keys.viewMap, [$scope.localKeys.showMapAndList]);
            if($scope.isUserLoggedIn()){
                getLoggedInDojosFromServerAndCreateDojoMap();
            } else {
                getNotLoggedInDojosFromServer();
            }
        };

        $scope.initialize();

    });//End searchForDojosCtrl