/**
 * Created by catap_000 on 7/10/2017.
 */

angular.module('coderDojoTimisoara')
    .controller('viewBadgeCtrl',function($scope, $rootScope, $route,  $location, dataService, helperSvc){
        $scope.viewReceivedBadges = {};

        $scope.getPresentableDateForBadgeReceived = function(badgeReceived){
            //convert the string to a date
            var date = new Date(badgeReceived.dateReceived);
            var ret = {};
            ret.dayOfWeek = helperSvc.capitalizeFirstLetter(keys.daysOfWeek[date.getDay()]);
            ret.dayOfMonth = date.getDate();
            ret.month = keys.months[date.getMonth()];
            ret.year = date.getFullYear();
            ret.dojoName = badgeReceived.receivedFromDojo.name;
            return ret;
        };

        $scope.goBackAction = function(){
            var badgesView = $scope.getBadgeView();
            if(badgesView.previousLocation === keys.viewBadgesLocation){
                $scope.goToViewBadges();
            }else if(badgesView.previousLocation === keys.myProfile){
                $scope.goToViewUserProfile();
            } else {
                $scope.goToViewUserProfile();
            }
        };

        $scope.goToEditBadge = function(){
            $scope.views = {};
            $scope.views[keys.goToEditBadge] = true;
        };

        $scope.goToViewBadge = function(){
            $scope.views = {};
            $scope.views[keys.viewBadge] = true;
        };

        $scope.isCurrentView = function(view) {
            return $scope.views[view];
        };

        //This is used by methods of inner scopes to set the badge in this scope
        $scope.setBadge = function(badge){
            $scope.badge = badge;
        };


        var initializeViewBadgeCtrl = function(){
            var badgesView = $scope.getBadgeView();
            if(badgesView){
                $scope.badge = badgesView.badge;
                $scope.views = {};
                $scope.views[keys.viewBadge] = true;
            } else {
                $scope.goToViewBadges();
            }
        };

        initializeViewBadgeCtrl();
    });