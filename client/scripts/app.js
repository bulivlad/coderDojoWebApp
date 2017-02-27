/**
 * Created by Adina Paraschiv on 2/21/2017.
 */


//Creem aplicatia
angular.module("coderDojoTimisoara", [
    'ngRoute'
])
    .config(['$routeProvider', function($routeProvider){
        $routeProvider
            .when('/' + "despre", {templateUrl:'../views/despre.html', controller: 'mainController'})
            .when('/' + "cum_pot_ajuta", {templateUrl:'../views/cum-pot-ajuta.html', controller: 'mainController'})
            //.otherwise({redirectTo: '/cum_pot_ajuta'})
    }])



const keys = {
    despre: 'despre'
}

