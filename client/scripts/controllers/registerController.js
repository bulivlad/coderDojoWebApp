/**
 * Created by Adina Paraschiv on 3/1/2017.
 */

angular.module("coderDojoTimisoara")
    .controller('registerController', function($scope, $rootScope, dataService, $location){
        $scope.years = [];
        var currentYear = (new Date().getFullYear());
        for (var i = currentYear; i > currentYear - 80; i--){
            $scope.years.push(i);
        }
        $scope.register = {dateMonth: 'Lună naștere', dateDay:'Zi naștere', dateYear:'An naștere'};

        $scope.registerUser = function(){
            var errors = validateRegisterFields($scope.register);
            if (errors){
                $scope.register.errors = errors;
            } else {
                var year = $scope.register.dateYear;
                var day = $scope.register.dateDay;
                var month = convertMonth($scope.register.dateMonth);
                var birthDate = new Date(Number(year), month, Number(day));

                var user = {
                    firstName: $scope.register.firstName,
                    lastName: $scope.register.lastName,
                    email: $scope.register.email,
                    password: $scope.register.password,
                    password2: $scope.register.password2,
                    birthdate: birthDate

                };
                dataService.registerUser(user, function(err, response){
                    if (err){
                         if (err.status === -1){
                            $scope.register.errors = {name:'Verificati conexiunea la internet'}
                        } else {
                            $scope.login.errors = {email:'Probleme de comunicare cu serverul'};
                        }

                    }
                    else if(response.data.errors){
                        $scope.register.errors = response.data.errors;
                    }else if (response.data.success){
                        resetValues($scope.register);
                        $rootScope.justRegistered = true;
                        $location.path('/' + keys.login);
                    }
                })
            }
        };



        var resetValues = function(register){
            register.firstName = '';
            register.lastName = '';
            register.email = '';
            register.password = '';
            register.password2 = '';
            register.dateMonth = 'Lună naștere';
            register.dateDay = 'Zi naștere';
            register.dateYear = 'An naștere';
        };

        var validateRegisterFields = function(register){
            var errors = {};
            var hasErrors = false;
            if (!register.firstName || register.firstName === ''){
                errors.firstName = 'Prenumele este necesar';
                hasErrors = true;
            }
            if (!register.lastName || register.lastName === ''){
                errors.lastName = 'Numele de familie este necesar';
                hasErrors = true;
            }
            if (!register.email || register.email === ''){
                errors.email = 'Email-ul este necesar';
                hasErrors = true;
            } else if (!register.email.match(/@/g)){//If the email contains @
                errors.email = 'Email-ul nu este valid';
                hasErrors = true;
            }
            if (!register.password || register.password === ''){
                errors.password = 'Parola este necesara';
                hasErrors = true;
            }
            else if (!isPasswordValid(register.password)){
                errors.password = 'Parola trebuie sa fie de minim 8 caractere si sa aibe cel putin o litera mare, una mica si o cifra';
                hasErrors = true;
            }
            if (!register.password2 || register.password2 === '' ||
                register.password !== register.password2){
                errors.password2 = 'Parola incorecta';
                hasErrors = true;
            }
            if(!register.dateDay || register.dateDay === 'Zi naștere'){
                errors.dateDay = 'Adauga ziua';
                hasErrors = true;
            }
            if(!register.dateMonth || register.dateMonth === 'Lună naștere'){
                errors.dateMonth = 'Adauga luna';
                hasErrors = true;
            }
            if(!register.dateYear || register.dateYear === 'An naștere'){
                errors.dateYear = 'Adauga anul';
                hasErrors = true;
            }


            if (hasErrors){
                return errors;
            } else {
                return null;
            }
        };

        var isPasswordValid = function(password){
            var ret = false;
            if (password.length >= 8){
                ret = true;
            } else if (password.match(/d+/g) && //password contains numbers
                       password.match(/[a-z]/g) &&//passwords contains normal letters
                       password.match(/[A-Z]/g)){//password contains capital letters
                ret = true;
            }
            return ret;
        };

        var convertMonth = function(month){
            var ret = 0;
            switch (month){
                case 'Februarie': ret = 1;break;
                case 'Martie': ret = 2;break;
                case 'Aprilie': ret = 3;break;
                case 'Mai': ret = 4;break;
                case 'Iunie': ret = 5;break;
                case 'Iulie': ret = 6;break;
                case 'August': ret = 7;break;
                case 'Septembrie': ret = 8;break;
                case 'Octombrie': ret = 9;break;
                case 'Noiembrie': ret = 10;break;
                case 'Decembrie': ret = 11;break;

            }
            return ret;
        }




    });