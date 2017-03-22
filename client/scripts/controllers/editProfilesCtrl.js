/**
 * Created by Paraschiv Adina on 3/11/2017.
 */

angular.module("coderDojoTimisoara")
    .controller("editProfilesCtrl", function($scope, $rootScope, $location, dataService, helperSvc){
        $scope.setUser = function(){
            var user = helperSvc.cloneUser($rootScope.user);
            $scope.myProfile = {user:user};
        }
        //Setting the local user(for this view)
        $scope.setUser();

        $scope.modifyAccountInfo = function(){
            var errors = helperSvc.validateFields($scope.myProfile.user);
            if (errors){
                $scope.myProfile.errors = errors;
            } else {
                dataService.editUser($scope.myProfile.user)
                    .then(function(response){
                        if(response.data.errors){
                            if(response.data.errors === keys.parentEmailNotMatchError){
                                alert('Utilizatorul logat nu corespunde cu cerinta.');
                            } else {
                                console.log(response.data.errors);
                            }
                        } else if (response.data.user){
                            let user = response.data.user;
                            user.birthDate = new Date(user.birthDate);
                            $rootScope.user = user;
                            $scope.setUser();
                            $rootScope.alert = keys.userModifiedAlert;
                            helperSvc.determineAlertPosition();
                        } else {
                            console.log('Error: response without a user!')
                        }
                    })
                    .catch(function(err){
                        if (err.status === 401){
                            console.log('Not authorized');
                            $location.path('/' + keys.login);
                        } else if (err.status === 500){
                            console.log('Problems with the database');
                        } else {
                            console.log('Error editing profile');
                        }
                    });
            }
        }

        //Method that returns a date with only year, month and day
        $scope.getPrettyDate = function(){
            return helperSvc.prettyDate($scope.myProfile.user.birthDate, false);
        }

        $scope.goToEditProfiles = function(){
            $location.path('/' + keys.editProfiles);
        }
    });