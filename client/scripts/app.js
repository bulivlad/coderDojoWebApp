/**
 * Created by Adina Paraschiv on 2/21/2017.
 */


//Creem aplicatia
angular.module("coderDojoTimisoara", [
    'ngRoute'
])
    .config(['$routeProvider', function($routeProvider, $rootScope, $location){

        $routeProvider
            .when('/' + keys.despre, {templateUrl:'../views/despre.html'})
            .when('/' + keys.cumPotAjuta, {templateUrl:'../views/cum-pot-ajuta.html', controller: 'howMayIHelpController'})
            .when('/' + keys.login, {templateUrl:'../views/login.html'})
            .when('/' + keys.register, {templateUrl:'../views/register.html'})
            .when('/' + keys.editProfiles, {templateUrl:'../views/edit-profiles.html'})
            .when('/' + keys.myProfile, {templateUrl:'../views/my-profile.html'})
            .when('/' + keys.getDojos, {templateUrl:'../views/inscrieri-saptamanale.html'})
            .when('/' + keys.getMyDojos, {templateUrl:'../views/dojourile-mele.html'})
            .otherwise({redirectTo: '/despre'})
    }]);



const keys = {
    //Communication routes
    despre: 'despre',
    cumPotAjuta: "cum_pot_ajuta",
    login: 'login',
    logout: 'logout',
    register: 'register',
    editUser: 'editUser',
    myProfile: 'myProfile',
    editProfiles: 'editProfiles',
    getDojos: 'getDojos',
    getAuthDojos: 'getAuthDojos',
    getMyDojos: 'getMyDojos',
    registerChildForDojo: 'registerChildForDojo',
    cancelChildRegistryForDojo: 'cancelChildRegistryForDojo',
    amIAuthenticated: 'amIAuthenticated',

    //Errors
    dbsUserCreationError: 'dbsUserCreationError',
    dbsUserSearchError: 'dbsUserSearchError',
    noMoreRoomInDojoError: 'noMoreRoomInDojoError',
    childAlreadyRegisteredError: 'childAlreadyRegisteredError',
    dojoNotFoundError: 'dojoNotFoundError',
    parentEmailNotMatchError: 'parentEmailNotMatchError',

    //Alerts
    childRegisterAlert: 'childRegisterAlert',
    userModifiedAlert: 'userModifiedAlert',

    //User roles
    user: 'user',
    admin:'admin',
    teacher: 'teacher'
};

