/**
     * Created by Adina Paraschiv on 2/22/2017.
     */

    angular.module("coderDojoTimisoara")
        .directive("despre", function(){
            return {
                templateUrl: 'directives/despre.html',
                controller: 'mainController',
                replace: true
            }
        })
        .directive("headerWide", function(){
            return {
                templateUrl: 'directives/header-wide.html',
                controller: 'headerController',
                replace: true
            }
        })
        .directive("headerNarrow", function(){
            return {
                templateUrl: 'directives/header-narrow.html',
                controller: 'headerController',
                replace: true
            }
        })

