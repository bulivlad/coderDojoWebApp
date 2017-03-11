/**
 * Created by Adina Paraschiv on 2/21/2017.
 */


//Creem aplicatia
angular.module("coderDojoTimisoara", [
    'ngRoute'
])
    .config(['$routeProvider', function($routeProvider){
        $routeProvider
            .when('/' + keys.despre, {templateUrl:'../views/despre.html'})
            .when('/' + keys.cumPotAjuta, {templateUrl:'../views/cum-pot-ajuta.html', controller: 'howMayIHelpController'})
            .when('/' + keys.login, {templateUrl:'../views/login.html'})
            .when('/' + keys.register, {templateUrl:'../views/register.html'})
            .otherwise({redirectTo: '/despre'})
    }]);



const keys = {
    despre: 'despre',
    cumPotAjuta: "cum_pot_ajuta",
    login: 'login',
    register: 'register',
    amIAuthenticated: 'amIAuthenticated',
    dbsUserCreationError: 'dbsUserCreationError',
    dbsUserSearchError: 'dbsUserSearchError',
    user: 'user',
    admin:'admin',
    teacher: 'teacher'
};

