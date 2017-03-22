/**
 * Created by Adina Paraschiv on 2/26/2017.
 */


let keyMap = {
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





module.exports = keyMap;
