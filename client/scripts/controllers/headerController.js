/**
 * Created by Adina Paraschiv on 2/21/2017.
 */

angular.module("coderDojoTimisoara")
    .controller("headerController", function($scope, $rootScope, $location, dataService){
        //Method that logs out user
        $scope.logoutUser = function(){
            dataService.logoutUser()
                .then(function(response){
                    if (response.data && response.data.success){
                        //Erasing current user
                        $scope.deleteUser('logoutUser');
                        $scope.hideUserMenuNarrow();
                        $location.path('/' + keys.despre);
                    } else {
                        console.log("Error");
                    }
                })
                .catch(function(err){
                    console.log(err);
                });
        };

        //Method for showing the navigation for narrow views(mobile)
        $scope.showMenuNarrow = function(){
            $('#navigation-narrow').show();
            setTimeout(function(){
                $('#navigation-narrow-full').addClass('slide');

            }, 100);

        };

        //Method for hiding the navigation for narrow views(mobile)
        $scope.hideMenuNarrow = function(){
            $('#navigation-narrow-full').removeClass('slide');
            $('#navigation-narrow-full-user').removeClass('slide');
            setTimeout(function(){
                //When hidding the menu for the narrow view, we must hide the user as well (in case it is opened)
                $('#navigation-narrow').hide();
                $('#navigation-narrow-full-user').hide();
            }, 400);
        };

        //Method for showing the user menu in narrow views (mobile)
        $scope.showUserMenuNarrow = function(){
            $('#navigation-narrow-full-user').show();
            setTimeout(function(){
                $('#navigation-narrow-full-user').addClass('slide');

            }, 100);
        };

        //Method for hiding the user menu in narrow views (mobile)
        $scope.hideUserMenuNarrow = function(){
            setTimeout(function(){
                $('#navigation-narrow-full-user').removeClass('slide');
            }, 100);
            //We hide the user menu after one second for the slide effect
            setTimeout(function(){
                $('#navigation-narrow-full-user').hide();
            }, 400)
        };


    });