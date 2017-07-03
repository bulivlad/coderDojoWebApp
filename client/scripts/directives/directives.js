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
    .directive("myProfile", function(){
        return {
            templateUrl: "directives/my-profile.html",
            replace: true
        }
    })
    .directive("editProfile", function(){
        return {
            templateUrl: "directives/edit-profile.html",
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
    .directive("dojoDirective", function(){
        return {
            templateUrl: "directives/dojo-directive.html",
            replace: true
        }
    })
    .directive("memberDirective", function(){
        return {
            templateUrl: "directives/member-directive.html",
            replace: true
        }
    })
    .directive("createOrEditDojoDirective", function(){
        return {
            templateUrl: "directives/create-or-edit-dojo-directive.html",
            replace: true
        }
    })
    .directive("eventDirective", function(){
        return {
            templateUrl: "directives/event-directive.html",
            replace: true
        }
    })
    .directive("displayEventDirective", function(){
        return {
            templateUrl: "directives/display-event-directive.html",
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
});


