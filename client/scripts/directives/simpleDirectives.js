/**
     * Created by Adina Paraschiv on 2/22/2017.
     */

    angular.module("coderDojoTimisoara")
        .directive("despre", function(){
            return {
                templateUrl: 'views/despre.html',
                controller: 'mainController',
                replace: true
            }
        })
        .directive("headerWide", function(){
            return {
                templateUrl: 'views/header-wide.html',
                controller: 'headerController',
                replace: true
            }
        })
        .directive("headerNarrow", function(){
            return {
                templateUrl: 'views/header-narrow.html',
                controller: 'headerController',
                replace: true
            }
        })

