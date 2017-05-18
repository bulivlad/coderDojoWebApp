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
            .when('/' + keys.editProfiles, {templateUrl:'../views/edit-profiles.html'})
            .when('/' + keys.myProfile, {templateUrl:'../views/my-profile.html'})
            .when('/' + keys.getDojosRoute, {templateUrl:'../views/inscrieri-saptamanale.html'})
            .when('/' + keys.getMyDojosRoute, {templateUrl:'../views/dojourile-mele.html'})
            .when('/' + keys.getDojoRoute, {templateUrl:'../views/view-dojo.html'})
            .when('/' + keys.addDojoRoute, {templateUrl:'../views/adauga-dojo.html'})
            .when('/' + keys.cautaUnDojo, {templateUrl:'../views/cauta-un-dojo.html'})
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
    editUsersChild: 'editUsersChild',
    myProfile: 'myProfile',
    editProfiles: 'editProfiles',
    getDojosRoute: 'getDojos',
    getMyDojosRoute: 'getMyDojos',
    getMyChildsDojosRoute: 'getMyChildsDojos',
    getDojoRoute: 'getDojo',
    getAuthDojoRoute: 'getAuthDojo',
    registerChildForDojo: 'registerChildForDojo',
    cancelChildRegistryForDojo: 'cancelChildRegistryForDojo',
    amIAuthenticatedUserRoute: 'amIAuthenticatedUserRoute',
    registerChildRoute: 'registerChildRoute',
    getChildrenRoute: 'getChildren',
    getUsersParentsRoute: 'getUsersParents',
    getChildsParentsRoute: 'getChildsParents',
    inviteUserToBeParentRoute: 'inviteUserToBeParent',
    getUsersNotificationsRoute: 'getUsersNotifications',
    getUsersChildNotificationsRoute: 'getUsersChildNotifications',
    deleteNotificationForUserRoute: 'deleteNotificationForUser',
    deleteNotificationForUsersChildRoute: 'deleteNotificationForUsersChild',
    acceptChildInviteRoute: 'acceptChildInvite',
    addDojoRoute: 'addDojo',
    deleteDojoRoute: 'deleteDojo',
    editDojoRoute: 'editDojo',
    cautaUnDojo: 'cautaUnDojo',
    becomeMemberOfDojoRoute: 'becomeMemberOfDojo',
    leaveDojoRoute: 'leaveDojo',
    getUsersForMember: 'getUsersForMember',
    getDetailedUserForMemberRoute: 'getDetailedUserForMember',
    acceptPendingMemberRoute: 'acceptPendingMember',
    rejectPendingMemberRoute: 'rejectPendingMember',
    uploadUserPictureRoute: 'uploadUserPicture',

    //Notification types
    parentInviteNotification: 'parentInviteNotification',
    infoNotification: 'infoNotification',

    //Errors
    dbsUserCreationError: 'dbsUserCreationError',
    dbsUserSearchError: 'dbsUserSearchError',
    noMoreRoomInDojoError: 'noMoreRoomInDojoError',
    childAlreadyRegisteredError: 'childAlreadyRegisteredError',
    dojoNotFoundError: 'dojoNotFoundError',
    wrongUserError: 'wrongUserError',
    noChildrenError: 'noChildrenError',
    noParentsError: 'noParentsError',
    notAuthorizedError: 'notAuthorizedError',
    userAlreadyJoinedDojoError: 'userAlreadyJoinedDojoError',
    userNoLongerPartOfDojo: 'userNoLongerPartOfDojo',

    //Alerts
    childRegisterAlert: 'childRegisterAlert',
    savingUserErrorAlert: 'savingUserErrorAlert',
    infoAlert: 'infoAlert',
    errorAlert: 'errorAlert',

    //User roles
    user: 'user',
    admin: 'admin',
    mentor: 'mentor',
    pendingMentor: 'pendingMentor',
    volunteer: 'volunteer',
    pendingVolunteer: 'pendingVolunteer',
    champion: 'champion',
    pendingChampion: 'pendingChampion',
    parent: 'parent',
    attendee: 'attendee',

    //Profile type
    editUserOver14Profile: 'editUserOver14Profile',     //Editing by the user himself/herself
    regChildUnder14Profile: 'regChildUnder14Profile',   //Registering by the parent
    regChildOver14Profile: 'regChildOver14Profile',     //Registering by the parent
    regUserOver14Profile: 'regUserOver14Profile',       //Registering by the user himself/herself

    //Views for users
    editUserProfile: 'editUserProfile',
    viewUserProfile: 'viewUserProfile',
    viewOtherParentProfile: 'viewOtherParentProfile',
    editChildUnder14Profile: 'editChildUnder14Profile', //Editing by the parent
    editChildOver14Profile: 'editChildOver14Profile',   //Editing by the parent
    viewUsersChildProfile: 'viewUsersChildProfile',
    addChildUnder14Profile: 'addChildUnder14Profile',
    addChildOver14Profile: 'addChildOver14Profile',
    showDojoInUserProfile: 'showDojoInUserProfile',
    showPasswords: 'showPasswords',
    showAlias: 'showAlias',
    showAddChildren: 'showAddChildren',
    showInviteParent: 'showInviteParent',
    hideEditButton: 'hideEditButton',
    uploadPhotoListenerInitiated: 'uploadPhotoListenerInitiated',

    //View for dojos
    viewMap: 'viewMap',
    viewList: 'viewList',
    viewDojo: 'viewDojo',
    viewEvent: 'viewEvent',
    editDojo: 'editDojo',
    editEvent: 'editEvent',
    viewMembers: 'viewMembers',

    //View keys for various views
    showBackButton: 'showBackButton',
    showMapAndList: 'showMapAndList',

    //PermissionsForDojo
    canEditDojo: 'canEditDojo',
    canAcceptMembers: 'canAcceptMembers', //can add mentors, attendees, volunteers
    canAddEvent: 'canAddEvent',
    canDeleteDojo: 'canDeleteDojo',
    hasJoined: 'hasJoined',
    isPendingJoining: 'isPendingJoining',
    showMembers: 'showMembers', //can view mentors, attendees, volunteers

    //Views for events
    showMultiEventTypes: 'showMultiEventTypes',

    //Enums
    daysOfWeek: ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbată', 'Duminică'],
    typesOfTickets: ['voluntar', 'mentor', 'cursant'],
    eventTypes: ['recurent', 'unic'],
    eventStatus: ['Activ', 'Inactiv']

};



