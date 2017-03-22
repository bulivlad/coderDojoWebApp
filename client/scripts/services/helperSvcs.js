/**
 * Created by Adina Paraschiv on 2/21/2017.
 */
'use strict';
angular.module('coderDojoTimisoara')
    .service('helperSvc', function(){

        //Method that determines the position of the window (how far we scrolled), for the alert to be correctly positioned
        this.determineAlertPosition = function(){
            var scrollPosition = $(window).scrollTop();
            $('#alert .inner').css('top', scrollPosition);
        }

        this.prettyDate = function(date, hourAndMinutes){
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
        }


        //Method for cloning a user
        this.cloneUser = function(user){
            if (user){
                var clone = JSON.parse(JSON.stringify(user));
                //We need to convert the date
                if (clone.birthDate){
                    clone.birthDate = new Date(clone.birthDate);
                }

                return clone;
            } else {
                return null;
            }
        }


        //Method used to validate input fileds for registering (returns an error object)
        this.validateFields = function(register, isItForRegister){
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
            if (isItForRegister && (!register.password || register.password === '') ){
                errors.password = 'Parola este necesara';
                hasErrors = true;
            }
            else if (isItForRegister && !this.isPasswordValid(register.password)){
                errors.password = 'Parola trebuie sa fie de minim 8 caractere si sa aibe cel putin o litera mare, una mica si o cifra';
                hasErrors = true;
            }
            if (isItForRegister &&
                (!register.password2 || register.password2 === '' || register.password !== register.password2)){
                errors.password2 = 'Parola incorecta';
                hasErrors = true;
            }
            if(isItForRegister && (!register.address || register.address === '') ){
                errors.address = 'Lipseste adresa';
                hasErrors = true;
            }
            if(isItForRegister && (!this.isPhoneValid(register.phone))){
                errors.phone = 'Numărul de telefon lipseste sau contine alte caractere';
                hasErrors = true;
            }
            if(!register.birthDate){
                errors.birthDate = 'Data nașterii este necesară';
                hasErrors = true;
            } else if (!this.isAgeGreaterThen14(register.birthDate)){
                errors.birthDate = 'Ne pare rau, nu ai varsta potrivita pentru a iti face un cont';
                hasErrors = true;
            }
            if (hasErrors){
                return errors;
            } else {
                return null;
            }
        };

        this.isAgeGreaterThen14 = function(birthDateRaw){
            var ret = false;
            var dateFourteenYearsAgo = new Date();
            dateFourteenYearsAgo.setFullYear((new Date()).getFullYear() - 14);// 14 years ago
            var birthDate = new Date(birthDateRaw);
            if (birthDate < dateFourteenYearsAgo){
                ret =  true;
            }
            return ret;
        }

        this.isPasswordValid = function(password){
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

        //Method that cheks a phone number contains only digits and is not empty
        this.isPhoneValid = function(phone){
            var ret = false;
            if(phone){
                ret = /^[0-9]*$/.test(phone);
            }
            return ret;
        }


    })
    .service('dojosService', function(){
        //Method used to multiply dojos if more than one child is registered for the same user (email)
        this.prepareMyDojosForDisplay = function(dojos){
            var ret = [];
            dojos.forEach(function(dojo){
                // If user has more than one child
                if (dojo.registered && dojo.registered.length > 1){
                    dojo.registered.forEach(function(child){
                        //cloning dojo
                        var newDojo = JSON.parse(JSON.stringify(dojo));
                        newDojo.registered = [child];
                        ret.push(newDojo);
                    });
                } else {
                    ret.push(dojo);
                }
            });
            return ret;
        }

    });