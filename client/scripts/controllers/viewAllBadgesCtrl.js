/**
 * Created by catap_000 on 7/10/2017.
 */

angular.module('coderDojoTimisoara')
    .controller('viewAllBadgesCtrl',function($scope, $rootScope, $route,  $location, dataService, helperSvc){

        //This is the method the viewBadgesCtrl will call when trying to get the badges to display them.
        $scope.getBadges = function(callback){
            if(!$scope.isUserLoggedIn()){
                getAllBadges(callback);
            } else {
                getAllAuthBadges(callback);
            }
        };


        var getAllBadges = function(callback){
            dataService.getAllBadges()
                .then(function(response){
                    if(response.data.badges){
                        $scope.badges = response.data.badges;
                        if(callback){
                            callback();
                        }
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getBadges() viewAllBadgesCtrl', $scope);
                })
        };

        var getAllAuthBadges = function(callback){
            dataService.getAuthAllBadges()
                .then(function(response){
                    if(response.data.allBadges && response.data.userBadges){
                        $scope.badges = helperSvc.mergeAllBadgesWithUserBadges(response.data.allBadges,
                            response.data.userBadges);
                        if(callback){
                            callback();
                        }
                    }
                })
                .catch(function(err){
                    helperSvc.handlerCommunicationErrors(err, 'getBadges() viewAllBadgesCtrl', $scope);
                })
        };

        $scope.clickBadgeAction = function(badge){
            $scope.setBadgeView(badge, keys.viewBadgesLocation);
            $scope.goToViewBadge();
        };

        $scope.setFilteredBadges = function(filteredBadges){
            $scope.filteredBadges = filteredBadges;
        }


    });
