/**
 * Created by AdinaParaschiv on 3/2/2017.
 */

angular.module("coderDojoTimisoara")
    .directive('alertDirective', function(){
        return {
            templateUrl: "directives/alert-directive.html",
            replace: true
        }
    })
    .directive('myDojos', function(){
        return {
            templateUrl: "directives/my-dojos.html",
            replace: true
        }
    })

    .directive("headerDirective", function(){
        return {
            templateUrl: "directives/header-directive.html",
            replace: true
        }
    })
    .directive("viewUserProfileDirective", function(){
        return {
            templateUrl: "directives/view-user-profile-directive.html",
            replace: true
        }
    })
    .directive("editUserProfileDirective", function(){
        return {
            templateUrl: "directives/edit-user-profile-directive.html",
            replace: true
        }
    })
    .directive("dojoListDirective", function(){
        return {
            templateUrl: "directives/dojo-list-directive.html",
            replace: true
        }
    })
    .directive("dojoBubbleDirective", function(){
        return {
            templateUrl: "directives/dojo-bubble-directive.html",
            replace: true
        }
    })
    .directive("viewDojoDirective", function(){
        return {
            templateUrl: "directives/view-dojo-directive.html",
            replace: true
        }
    })
    .directive("dojoMemberDirective", function(){
        return {
            templateUrl: "directives/dojo-member-directive.html",
            replace: true
        }
    })
    .directive("addOrEditDojoDirective", function(){
        return {
            templateUrl: "directives/add-or-edit-dojo-directive.html",
            replace: true
        }
    })
    .directive("viewEventDirective", function(){
        return {
            templateUrl: "directives/view-event-directive.html",
            replace: true
        }
    })
    .directive("displayEditableEventDirective", function(){
        return {
            templateUrl: "directives/display-editable-event-directive.html",
            replace: true
        }
    })
    .directive("informationDirective", function(){
        return {
            templateUrl: "directives/information-directive.html",
            replace: true
        }
    })
    .directive("addOrEditEventDirective", function(){
        return {
            templateUrl: "directives/add-or-edit-event-directive.html",
            replace: true
        }
    })
    .directive("inviteUsersToEventDirective", function(){
        return {
            templateUrl: "directives/invite-users-to-event-directive.html",
            replace: true
        }
    })
    .directive("addOrEditBadgeDirective", function(){
        return {
            templateUrl: "directives/add-or-edit-badge-directive.html",
            replace: true
        }
    })
    .directive("viewBadgesDirective", function(){
        return {
            templateUrl: "directives/view-badges-directive.html",
            replace: true
        }
    })
    .directive("addBadgesToUsersDirective", function(){
        return {
            templateUrl: "directives/add-badges-to-users-directive.html",
            replace: true
        }
    })
    .directive("showEventsDirective", function(){
        return {
            templateUrl: "directives/show-events-directive.html",
            replace: true
        }
    })
    .directive("addOrEditSpecialEventDirective", function(){
        return {
            templateUrl: "directives/add-or-edit-special-event-directive.html",
            replace: true
        }
    })
    .directive("specialEventsDirective", function(){
        return {
            templateUrl: "directives/special-events-directive.html",
            replace: true
        }
    })
    .directive("viewSpecialEventDirective", function(){
        return {
            templateUrl: "directives/view-special-event-directive.html",
            replace: true
        }
    })
    .directive("aboutDirective", function(){
        return {
            templateUrl: 'directives/despre.html',
            controller: 'mainCtrl',
            replace: true
        }
    })
    .directive("headerWideDirective", function(){
        return {
            templateUrl: 'directives/header-wide-directive.html',
            replace: true
        }
    })
    .directive("headerNarrowDirective", function(){
        return {
            templateUrl: 'directives/header-narrow-directive.html',
            replace: true
        }
    })
    .directive("changeUserIdentificationDirective", function(){
        return {
            templateUrl: 'directives/change-user-identification-directive.html',
            replace: true
        }
    })
    .directive("changeUserPasswordsDirective", function(){
        return {
            templateUrl: 'directives/change-user-passwords-directive.html',
            replace: true
        }
    });


