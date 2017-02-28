/**
 * Created by Adina Paraschiv on 2/21/2017.
 */

//Creem aplicatia
angular.module("coderDojoTimisoara")
    .controller("headerController", function($scope){

        $scope.showMenuNarrow = function(){
            $('#navigation-narrow').show();
            setTimeout(function(){
                $('#navigation-narrow-full').addClass('slide');

            }, 100);

        }

        $scope.hideMenuNarrow = function(){
            $('#navigation-narrow-full').removeClass('slide');
            setTimeout(function(){
                $('#navigation-narrow').hide();
            }, 400);
        }
    })