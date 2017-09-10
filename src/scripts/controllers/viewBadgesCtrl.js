/**
 * Created by catap_000 on 6/20/2017.
 */

angular.module('coderDojoTimisoara')
    .controller('viewBadgesCtrl', function($scope, $rootScope, $route,  $location, dataService, helperSvc){
        //Controllers that have this controller as a sub controller must have the following methods:
        // getBadges(callback) that gets badges from the server and saves then in their scope. This method must take a callback
        //      that determines the filtereBadges and saves them to that controllers scope
        // clickBadgeAction that deals with a badge being clickedOn
        // setFilteredBadges(filteredBadges) a method that sets the filtered badges to their scope

        //We initialy set the filter system to be active
        $scope.showBadgesFilterMenu = {view: true};

        var filterBadges = function(badges){
            var ret = angular.copy(badges);
            if($scope.badgeFilterType === keys.filterBadgesValues.nameWritten){
                if(!$scope.badgeFilterName || $scope.badgeFilterName === ''){
                    //This is the case when the user selects the filter by name, but no name exist input yet. This also
                    //happens when the user deletes every character and we are left with an empty input
                    if(($scope.filteredBadges) && ($scope.badges.length === $scope.filteredBadges.length)){
                        //This is the case where all the badges are in the filtered badges array (case when a user clicks
                        //the select by name, and no input is yet available. In this case, we can add the old filtered badges
                        ret =  $scope.filteredBadges;
                    } else {
                        //This is the case where the the input has been deleted, but the last filter might have removed
                        //some badges. In this case we default to name down
                        ret.sort(helperSvc.sortBadgeNameAsc);
                    }
                } else {
                    ret =  filterBadgesBasedOnWrittenName(badges);
                }
            }
            else if($scope.badgeFilterType === keys.filterBadgesValues.nameUp){
                ret.sort(helperSvc.sortBadgeNameAsc);
            } else if($scope.badgeFilterType === keys.filterBadgesValues.nameDown){
                ret.sort(helperSvc.sortBadgeNameDesc);
            } else if($scope.badgeFilterType === keys.filterBadgesValues.pointsDown){
                ret.sort(helperSvc.sortBadgePointsDesc);
            }  else if($scope.badgeFilterType === keys.filterBadgesValues.pointsUp){
                ret.sort(helperSvc.sortBadgePointsAsc);
            }
            return ret;
        };

        $scope.toggleFilterMenu = function(){
            if($scope.showBadgesFilterMenu.view){
                $scope.showBadgesFilterMenu.view = false;
            } else {
                $scope.showBadgesFilterMenu.view = true;
            }
        };

        var filterBadgesBasedOnWrittenName = function(badges){
            var ret = [];
            //We add diacritics to the words typed, and split them into different words
            var wordsFilteredFor = helperSvc.addDiacriticsToSearch($scope.badgeFilterName).split(' ');
            badges.forEach(function(badge){
                //We split the badge name into words
                var wordsInBadgeName = badge.name.split(' ');
                var matches = 0;
                var numberOfNecessaryMatches = wordsFilteredFor.length;

                //We go through every word entered by the user. Every word must match, and it can match only once.
                for(var j = 0; j < wordsFilteredFor.length; j++){
                    var wordFilteredFor = wordsFilteredFor[j];
                    var regexToSeachFor = new RegExp(wordFilteredFor, 'i');
                    //We go trough every word of the badge name. IF there is a match, we count it, and we break.
                    for(var i = 0; i < wordsInBadgeName.length; i++){
                        var wordBadgeName = wordsInBadgeName[i];
                        if(wordBadgeName.match(regexToSeachFor)){
                            matches++;
                            break;
                        }
                    }
                    //If the number of matches needed to complete are less then the remaining words to try, we break
                    var matchesNeeded = numberOfNecessaryMatches - matches;
                    var remainingMatches = numberOfNecessaryMatches - (j + 1);
                    if(matchesNeeded > remainingMatches){
                        break;
                    }
                }
                if(matches >= numberOfNecessaryMatches){
                    ret.push(badge);
                }

            });
            //After filtering the names we sort then alphabetically
            ret.sort(helperSvc.sortBadgeNameDesc);
            return ret;
        };

        $scope.getPoints = function(badge){
            if(badge.points === 1){
                return 'punct';
            } else {
                return 'puncte';
            }
        };


        var getFilterType = function(){
            if($scope.badgeFilterType){
                return $scope.badgeFilterType;
            } else {
                if(localStorage){
                    if(localStorage.badgeFilterType){
                        return localStorage.badgeFilterType;
                    } else {
                        return keys.filterBadgesValues.nameDown;
                    }
                }
            }
        };

        var setFilterType = function(filterType){
            $scope.badgeFilterType = filterType;
            if(localStorage){
                localStorage.badgeFilterType = filterType;
                //IF there is local storage, and we are filtering based on a written name, we save the value
                if(filterType === keys.filterBadgesValues.nameWritten){
                    localStorage.badgeFilterName = $scope.badgeFilterName;
                }
            }

        };

        $scope.selectBadgesFilter = function(filterType){
            //When name filter is selected
            if(filterType === keys.filterBadgesValues.name) {
                //if name-down is the previous filter we set name-up as the current
                if($scope.badgeFilterType === keys.filterBadgesValues.nameDown){
                    setFilterType(keys.filterBadgesValues.nameUp)
                } else {
                    //name-down is the default name filter
                    setFilterType(keys.filterBadgesValues.nameDown);
                }
            }
            //When points filter is selected
            else if(filterType === keys.filterBadgesValues.points) {
                //if points-down is the previous filter we set name-up as the current
                if($scope.badgeFilterType === keys.filterBadgesValues.pointsDown){
                    setFilterType(keys.filterBadgesValues.pointsUp)
                } else {
                    //points-down is the default name filter
                    setFilterType(keys.filterBadgesValues.pointsDown);
                }
            }
            else {
                //This is the case when a particular filter is selected (when deleting the input for written name)
                setFilterType(filterType);
            }

            //After setting the filter type, we filter the badges
            $scope.filteredBadges = filterBadges($scope.badges);
        };

        var initializeFiltering = function(){
            var badgeFilterType = getFilterType();
            $scope.badgeFilterType = badgeFilterType;
            if(badgeFilterType === keys.filterBadgesValues.nameWritten){
                if(localStorage){
                    $scope.badgeFilterName = localStorage.badgeFilterName;
                }
                //If filtering by name was selected, but for some reason no name is received we initialize with an empty string
                if(!$scope.badgeFilterName){
                    $scope.badgeFilterName = '';
                }

            }
        };

        var initializeViewBadgesCtrl = function(){
            initializeFiltering();
            if(!$scope.isEditProfilesCtrlParent){
                //We only get the badges if the parent ctrl is not the editProfilesCtrl
                $scope.getBadges(function(){
                    $scope.setFilteredBadges(filterBadges($scope.badges));
                });
            } else {
                //If this is editProfilesCtrl, we minimize thegetBackgroundUrlForSpecialEventPhoto filter badges by default
                $scope.showBadgesFilterMenu.view = false;
            }

        };
        initializeViewBadgesCtrl();

    })

