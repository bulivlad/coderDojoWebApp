/**
 * Created by AdinaParaschiv on 3/2/2017.
 */

angular.module("coderDojoTimisoara")
    .directive("dateDay", function(){
        return {
            templateUrl: "templates/date-day.html",
            controller: "registerController",
            replace: true
        };
    })
    .directive("dateMonth", function(){
        return {
            templateUrl: "templates/date-month.html",
            controller: "registerController",
            replace: true
        };
    })
    .directive("dateYear", function(){
        return {
            templateUrl: "templates/date-year.html",
            controller: "registerController",
            replace: true
        };
    });
