/**
 * Created by AdinaParaschiv on 3/2/2017.
 */

angular.module("coderDojoTimisoara")
    .directive('alertDirective', function(){
        return {
            templateUrl: "directives/alert.html",
            replace: true
        }
    })
    .directive('dojosDirective', function(){
        return {
            templateUrl: "directives/dojos.html",
            replace: true
        }
    })

    .directive("dateDay", function(){
        return {
            templateUrl: "directives/date-day.html",
            replace: true
        };
    })
    .directive("dateMonth", function(){
        return {
            templateUrl: "directives/date-month.html",
            replace: true
        };
    })
    .directive("dateYear", function(){
        return {
            templateUrl: "directives/date-year.html",
            replace: true
        }
    })
    .directive("headerDirective", function(){
        return {
            templateUrl: "directives/header-directive.html",
            replace: true
        }
    });
