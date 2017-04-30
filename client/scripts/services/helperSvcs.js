/**
 * Created by Adina Paraschiv on 2/21/2017.
 */
'use strict';
angular.module('coderDojoTimisoara')
    .service('helperSvc', function($location, $rootScope){

        //Method that determines the position of the window (how far we scrolled), for the alert to be correctly positioned
        this.determineAlertPosition = function(){
            var scrollPosition = $(window).scrollTop();
            $('#alert .inner').css('top', scrollPosition);
        };

        this.scrollToTop = function(){
            $('body').scrollTop(0);
        };

        this.prettyDate = function(date, hourAndMinutes){
            if(angular.isString(date)){
                date = new Date(date);
            }
            var day = date.getDate();
            var month = date.getMonth() + 1;
            var year = date.getFullYear();
            var hour = date.getHours();
            var minutes = date.getMinutes();
            var ret = (day < 10 ? '0' + day: '' + day) + '.' +
                      (month < 10 ? '0' + month: '' + month) + '.' +
                      year + ' ';
            if(hourAndMinutes){
                ret +=  hour + ':' +
                    (minutes < 10 ? '0' + minutes : '' + minutes);
            }
            return ret;
        };


        //Method for cloning a user
        this.cloneUser = function(user){
            if (user){
                var clone = JSON.parse(JSON.stringify(user));
                //We need to convert the date
                if (clone.birthDate){
                    clone.birthDate = new Date(clone.birthDate);
                }

                return clone;
            }
        };

        //Method that clones an array of users, converting the dates from string to Date
        this.cloneArrayOfUsers = function(users){
            if(users){
                var clone = JSON.parse(JSON.stringify(users));
                return clone.map(function(childOrParent){
                    if(childOrParent.birthDate){
                        childOrParent.birthDate = new Date(childOrParent.birthDate);
                    }
                    return childOrParent;
                })
            }
        };


        //Method used to validate input fileds for registering (returns an error object)
        this.validateFields = function(user, validationForWhat){
            var errors = {};
            var hasErrors = false;
            //These fields are for all users
            if (!user.firstName || user.firstName === ''){
                errors.firstName = 'Prenumele este necesar';
                hasErrors = true;
            }
            if (!user.lastName || user.lastName === ''){
                errors.lastName = 'Numele de familie este necesar';
                hasErrors = true;
            }
            if(!user.address || user.address === ''){
                errors.address = 'Lipseste adresa';
                hasErrors = true;
            }
            if(!this.isPhoneValid(user.phone)){
                errors.phone = 'Numărul de telefon lipseste sau contine alte caractere';
                hasErrors = true;
            }
            if(!user.birthDate){
                errors.birthDate = 'Data nașterii este necesară';
                hasErrors = true;
            }

            //Registering or editing a user by himself/herself
            if(validationForWhat === keys.editUserOver14Profile ||
               validationForWhat === keys.regUserOver14Profile){
                if (!user.email || user.email === ''){
                    errors.email = 'Email-ul este necesar';
                    hasErrors = true;
                } else if (!user.email.match(/@/g)){//If the email contains @
                    errors.email = 'Email-ul nu este valid';
                    hasErrors = true;
                }
            }

            //Register user over 14 by himself/herself
            if (validationForWhat === keys.regUserOver14Profile){
                hasErrors = this.checkPasswords(user, errors);

                if (user.birthDate && !this.isAgeGreaterThen14(user.birthDate)){
                    errors.birthDate = 'Ne pare rau, trebuie sa ai peste 14 ani pentru a iti creea cont';
                    hasErrors = true;
                }
            }

            //Edit user over 14 by himself/herself
            if(validationForWhat === keys.editUserOver14Profile){
                if (user.birthDate && !this.isAgeGreaterThen14(user.birthDate)){
                    errors.birthDate = 'Ne pare rau, trebuie sa ai peste 14 ani';
                    hasErrors = true;
                }
            }

            //Register or Edit child younger than 14 by parent
            if(validationForWhat === keys.editChildUnder14Profile ||
               validationForWhat === keys.regChildUnder14Profile){
                if (user.birthDate && !this.isAgeLessThen14(user.birthDate)){
                    errors.birthDate = 'Ne pare rau, copilul nu are vârsta potrivită';
                    hasErrors = true;
                }

                if(!user.alias){
                    errors.alias = 'Aliasul este necesar';
                    hasErrors = true;
                } else if(!this.isAliasValid(user.alias)){
                    errors.alias = 'Aliasul poate conține doar caractere [A-Z,a-z,0-9]';
                    hasErrors = true;
                }
            }

            //Register child older than 14 by parent
            if(validationForWhat === keys.regChildOver14Profile){
                if(!user.alias){
                    errors.alias = 'Aliasul este necesar';
                    hasErrors = true;
                } else if(!this.isAliasValid(user.alias)){
                    errors.alias = 'Aliasul poate conține doar caractere [A-Z,a-z,0-9]';
                    hasErrors = true;
                }

                if(!this.isAgeBetween14and18(user.birthDate)){
                    errors.birthDate = 'Varsta trebuie sa fie intre 14 si 18 ani';
                    hasErrors = true;
                }

                //If a password was filled, we check it is valid
                if(user.password || user.password2){
                   hasErrors =  this.checkPasswords(user, errors);
                }
            }

            //Edit child older than 14 by parent
            if(validationForWhat === keys.editChildOver14Profile){

                if(!this.isAgeBetween14and18(user.birthDate)){
                    errors.birthDate = 'Varsta trebuie sa fie intre 14 si 18 ani';
                    hasErrors = true;
                }

                //If a password was filled, we check it is valid
                if(user.password || user.password2){
                    this.checkPasswords(user, errors);
                }

                if(!user.email){
                    //If the child doesn't have email, the child must have an alias
                    if(!user.alias){
                        errors.alias = 'Aliasul este necesar';
                        hasErrors = true;
                    } else if(!this.isAliasValid(user.alias)){
                        errors.alias = 'Aliasul poate conține doar caractere [A-Z,a-z,0-9]';
                        hasErrors = true;
                    }
                } else {
                    //If the user has email, it must be valid
                    if (!user.email || user.email === ''){
                        errors.email = 'Email-ul este necesar';
                        hasErrors = true;
                    } else if (!user.email.match(/@/g)){//If the email doesn't contains @
                        errors.email = 'Email-ul nu este valid';
                        hasErrors = true;
                    }
                }
            }

            if (hasErrors){
                return errors;
            } else {
                return null;
            }
        };


        this.validateEmailForInvite = function(email){
            var errors = {};
            var hasErrors = false;
            if (!email || email === ''){
                errors.inviteEmail = 'Email-ul este necesar';
                hasErrors = true;
            } else if (!email.match(/@/g)){//If the email contains @
                errors.inviteEmail = 'Email-ul nu este valid';
                hasErrors = true;
            }
            if (hasErrors){
                return errors;
            } else {
                return null;
            }
        };

        this.isAliasValid = function(alias){
            var containsAcceptedCharacters = alias.match(/[A-Za-z0-9]+/g);
            var doesNotContainUnacceptedCharacters =  !alias.match(/[^A-Za-z0-9]+/g);
            return containsAcceptedCharacters && doesNotContainUnacceptedCharacters;
        };

        //Method that checks if passwords are equal and strong enough.
        this.checkPasswords = function(user, errors){
            var hasErrors = false;
            if (!user.password || user.password === ''){
                errors.password = 'Parola este necesara';
                hasErrors = true;
            }
            else if (!this.isPasswordValid(user.password)){
                errors.password = 'Parola trebuie sa fie de minim 8 caractere si sa aibe cel putin o litera mare, una mica si o cifra';
                hasErrors = true;
            }
            if (!user.password2 || (user.password2 === '')){
                errors.password2 = 'Confirmarea parolei lipsește';
                hasErrors = true;
            } else if ((user.password !== user.password2)) {
                errors.password2 = 'Parola nu este aceeași';
                hasErrors = true;
            }

            return hasErrors;
        };


        //Method that determines if a user's age is less or more than an value provided (ageOffset).
        this.compareAge = function(birthDateRaw, ageOffset, lessOrMore){
            var ret = false;
            var dateToCompareTo = new Date();
            dateToCompareTo.setFullYear((new Date()).getFullYear() - ageOffset);//
            var birthDate = new Date(birthDateRaw);
            // younger than age
            if (lessOrMore === 'younger'){
                if (birthDate > dateToCompareTo){
                    ret =  true;
                }
            } else {
                //Older than age
                if (birthDate < dateToCompareTo){
                    ret =  true;
                }
            }

            return ret;
        };

        this.isAgeGreaterThen14 = function(birthDateRaw){
           return this.compareAge(birthDateRaw, 14, 'older');
        };

        this.isAgeGreaterThen18 = function(birthDateRaw){
            return this.compareAge(birthDateRaw, 18, 'older');
        };

        this.isAgeLessThen14 = function(birthDateRaw){
            return this.compareAge(birthDateRaw, 14, 'younger');
        };

        this.isAgeBetween14and18 = function(birthDateRaw){
            return this.compareAge(birthDateRaw, 14, 'older') && //Older than 14
                   this.compareAge(birthDateRaw, 18, 'younger'); //Younger than 18
        };


        this.isPasswordValid = function(password){
            var ret = false;
            if ((password.length >= 8) && //Pasword contains at least 8 characters
                 password.match(/[a-z]+/g) && //Password contains at least one small letter
                 password.match(/[A-Z]+/g) && //Password contains at least one capital letter
                 password.match(/[0-9]+/g)){ //Password contains at least one number

                ret = true;
            }
            return ret;
        };

        //Method that cheks a phone number contains only digits and is not empty
        this.isPhoneValid = function(phone){
            var ret = false;
            if(phone){
                ret = /^[0-9]*$/.test(phone);
            }
            return ret;
        };

        //Method for scrolling to the top of the windows
        this.scrollToTop = function(){
            $(function(){
                $('body').scrollTop(0);
            });
        };

        //Method that receives errors from the server, formatted a different way than the client ones, and coverts
        //them to client errors.
        this.convertServerErrorsToClientErrors = function(errors){
            var clientErrors = {};
            errors.forEach(function(error){
                if (error.param.includes('birthDate')){
                    clientErrors.birthDate = error.msg;
                } else if (error.param.includes('address')){
                    clientErrors.address = error.msg;
                } else if (error.param.includes('firstName')){
                    clientErrors.firstName = error.msg;
                } else if (error.param.includes('lastName')){
                    clientErrors.lastName = error.msg;
                } else if (error.param.includes('email')){
                    clientErrors.email = error.msg;
                } else if (error.param.includes('password') && !error.param.includes('password2')){
                    clientErrors.password = error.msg;
                } else if (error.param.includes('password2')){
                    clientErrors.password2 = error.msg;
                } else if (error.param.includes('phone')){
                    clientErrors.phone = error.msg;
                } else if (error.param.includes('alias')){
                    clientErrors.alias = error.msg;
                }else if (error.param.includes('inviteEmail')){
                    clientErrors.inviteEmail = error.msg;
                }
            });
            return clientErrors;
        };

        this.handlerCommunicationErrors = function(err, methodInfo, scope){
            if (err.status === 401){
                console.log('Not authorized:' + err.msg);
                $rootScope.deleteUser(methodInfo);
                $location.path('/' + keys.login);
            } else if (err.status === 500){
                //Display an alert notifying the user that the operation did not succeed
                if(scope){
                    scope.setAlert(keys.errorAlert, 'Probleme de comunicare cu serverul, te rugăm să mai încerci.');
                }
                console.log('Problems with the database for method (' + methodInfo + '):' + err.msg);
                $location.path('/' + keys.despre);
            }  else {
                console.log('Unexpected error for method (' + methodInfo + '):' + err.msg);
                $location.path('/' + keys.despre);
            }
        };

        //Method for getting a dojo from a list of dojos
        this.getDojoFromDojos = function(dojoId, dojos){
            for(var i = 0; i < dojos.length; i++){
                var curDojo = dojos[i];
                if(curDojo._id === dojoId){
                    return curDojo;
                }
            }
        };
    })
    .service('dojosService', function(){
    });