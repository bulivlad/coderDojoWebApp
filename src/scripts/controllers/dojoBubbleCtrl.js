/**
 * Created by catap_000 on 7/10/2017.
 */


angular.module("coderDojoTimisoara")
    .controller('dojoBubbleCtrl', function($scope, $location, dataService, helperSvc){
        $scope.bubbleDojos = [];

        //TODO get the dojos for the child, not the user

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
                    helperSvc.handlerCommunicationErrors(err, 'getUsersDojos - dojosCtrl', $scope);
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
        $scope.selectDojoAction = function(dojo, locationDojoCalledFrom){
            //For the use of the back button
            $scope.setDojoSelector(locationDojoCalledFrom);
            $scope.setToBeViewedDojoId(dojo._id);
            $scope.goToViewDojo();
        };


    });