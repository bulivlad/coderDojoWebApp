/**
 * Created by Adina Paraschiv on 4/25/2017.
 */

angular.module("coderDojoTimisoara")
    .controller('dojoCtrl', function($scope, $rootScope, $location, $compile, dataService, helperSvc, dojosService){
        $scope.dojo = {};
        $scope.views = {};

        //Method for getting a dojo for an Un-authenticated user
        $scope.getDojoFromServerAndMakeMap = function(dojoId){
            dataService.getDojo({dojoId: dojoId})
                .then(function(response){
                    if (response.data.dojo){
                        $scope.dojo = response.data.dojo;
                        createMapWithDojo($scope.dojo, 'dojo-map-single-dojo')
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getDojoFromServerAndMakeMap - dojoCtrl', $scope);
                })

        };

        //Method for getting a dojo for an Authenticated user
        $scope.getAuthDojoFromServerAndMakeMap = function(dojoId){
            dataService.getAuthDojo({dojoId: dojoId})
                .then(function(response){
                    if (response.data.dojo){
                        $scope.dojo = response.data.dojo;
                        createMapWithDojo($scope.dojo, 'dojo-map-single-dojo')
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getDojoFromServerAndMakeMap - dojoCtrl', $scope);
                })
        };

        $scope.setView = function(view, extraShowFlags){
            $scope.views = {};
            $scope.views[view] = true;
            if(extraShowFlags){
                extraShowFlags.forEach(function(flag){
                    $scope.views[flag] = true;
                })
            }
        };

        //Method for navigating back in the dojo view
        $scope.goBackAction = function(){
            if($scope.isCurrentView(keys.viewDojo)){
                $scope.initializeDojosCtrl();
            } else if($scope.isCurrentView(keys.viewMembers) || // if Viewing members
                $scope.isCurrentView(keys.editDojo)){     // or editing dojos
                $scope.setView(keys.viewDojo, [keys.showBackButton]);
                createMapWithSingleDojo();
            }

        };

        //Method for determining the users role in the dojo
        $scope.getUserRoleInDojo = function(){
            if($scope.dojo.mentor){
                return 'Mentor';
            } else if($scope.dojo.attendee){
                return 'Elev';
            } else if($scope.dojo.parent){
                return 'Parinte';
            } else  if($scope.dojo.champion){
                return 'Campion';
            } else  if($scope.dojo.volunteer){
                return 'Voluntar in asteptare';
            } else  if($scope.dojo.pendingMentor){
                return 'Mentor in asteptare';
            }else  if($scope.dojo.pendingVolunteer){
                return 'Voluntar in asteptare';
            } else  if($scope.dojo.pendingChampion){
                return 'Campion in asteptare';
            } else if($scope.dojo.admin){
                return 'Administator';
            } else {
                return '-';
            }
        };

        //Method for goin into edit dojo mode
        $scope.goToEditDojo = function(){
            $scope.setView(keys.editDojo);
        };

        // Method to determine if the current view is thisView
        $scope.isCurrentView = function(thisView){
            return $scope.views[thisView];
        };

        $scope.createSchedule = function(rawSchedule){
            var ret = '';

            if(rawSchedule){
                //rawSchedules.forEach(function(rawSchedule){
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
                //ret += '\n';
                //});
            }

            return ret;
        };

        //Method for sernding request to server to become a member of a dojo
        $scope.becomeMemberOfDojo = function($event, whatMember){
            $event.stopPropagation();
            var currentDojoId = $scope.dojo._id;
            dataService.becomeMemberOfDojo({dojoId: currentDojoId, whatMember: whatMember})
                .then(function(response){
                    if(response.data.success){
                        //If the request for membership has been sent successfully, we refresh the dojos
                        // from the server (with the current user joined or pending)
                        dataService.getAuthDojo({dojoId: currentDojoId})
                            .then(function(response){
                                if(response.data.dojo){
                                    $scope.dojo = response.data.dojo;
                                }
                                $scope.closeJoinModal();
                            })
                            .catch(function(err){
                                $scope.closeJoinModal();
                                $scope.initializeDojosCtrl();
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

        $scope.goToViewMembers = function(){
            $scope.setView(keys.viewMembers, [keys.showBackButton]);
        };

        //method for joining dojo
        $scope.joinDojoAction = function(){
            if($scope.isUserLoggedIn()){
                $('body').css('overflow', 'hidden');
                $scope.views.showJoin = true;
                if(helperSvc.isAgeGreaterThen18($scope.user.birthDate)){
                    $scope.views.isAdult = true;
                }
            } else {
                $scope.goToLogin();
            }
        };

        //Method for leaving dojo
        $scope.leaveDojoAction = function(){
            var currentDojoId = $scope.dojo._id;
            dataService.leaveDojo({dojoId: currentDojoId})
                .then(function(response){
                    if(response.data.success){
                        //If the leaving of the dojo has been successful, we reload the dojos and set the current
                        // dojo as the loaded dojo
                        dataService.getAuthDojo({dojoId: currentDojoId})
                            .then(function(response){
                                if(response.data.dojo){
                                    $scope.dojo = response.data.dojo;
                                }
                            })
                            .catch(function(err){
                                $scope.initializeDojosCtrl();
                                console.log(err);
                            })
                    }
                })
        };

        $scope.closeJoinModal = function(){
            $scope.views.showJoin = false;
            $('body').css('overflow', 'auto');
        };


        var createMapWithDojo = function(dojo, elementName){
            setTimeout(function(){
                drawMap(dojo, elementName);
            }, 300)
        };


        //Method for injecting a google maps plugin for displaying a dojo. Element name is the element where we are
        //going to inject the map (it's id).
        var drawMap = function(dojo, elementName){
            var latLongTimisoara = new google.maps.LatLng(45.756818, 21.228600);

            $scope.mapProp = {
                center: latLongTimisoara,
                zoom: 12,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            mapObj = new google.maps.Map(document.getElementById(elementName), $scope.mapProp);

            //Creating markers
            var markerLatLng =  new google.maps.LatLng(dojo.latitude, dojo.longitude);
            var marker = new google.maps.Marker({
                position: markerLatLng,
                map: mapObj,
                name:dojo.name
            });

        };

        var createMapWithSingleDojo = function(){
            setTimeout(function(){
                createMapWithDojo($scope.dojo, 'dojo-map-single-dojo');

            }, 200);
        };

        $scope.initializeDojoCtrl = function(){
            var toBeViewedDojoId = $scope.getToBeViewedDojoId();
            //We check the a dojo to be viewed has been set in another view (it should have been, otherwise an error
            // has occurred, and we go to the search dojos page
            if(toBeViewedDojoId){
                $scope.setView(keys.viewDojo);
                if($scope.isUserLoggedIn()){
                     $scope.getAuthDojoFromServerAndMakeMap(toBeViewedDojoId);
                } else {
                    $scope.getDojoFromServerAndMakeMap(toBeViewedDojoId);
                }
            } else {
                $location.path('/' + keys.cautaUnDojo);
            }
        };

        $scope.initializeDojoCtrl();
    });
