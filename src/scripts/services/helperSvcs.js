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

        //This method helps filtering (too hard to put in english what it actually does, look to the name)
        var addDiacriticsToSearch = this.addDiacriticsToSearch = function(originalString){
            var ret = '';
            for(var i = 0; i < originalString.length; i++){
                var strChar = originalString.charAt(i).toLowerCase();
                if(strChar === 'a' || strChar === 'ă' || strChar === 'â'){
                    ret += '[aăâ]';
                } else if(strChar === 'i' || strChar === 'î'){
                    ret += '[iî]';
                } else if(strChar === 't' || strChar === 'ț'){
                    ret += '[tț]';
                } else if(strChar === 's' || strChar === 'ș'){
                    ret += '[sș]';
                } else {
                    if(!charIsUnsupportedValue(strChar)){
                        ret += strChar;
                    }
                }
            }
            return ret;

        };

        var charIsUnsupportedValue = function(strChar){
            //I used an array instead of a regex because the regex would throw an exception when testing for '['
            return  ['¬', '`', '!', '\'', '"', '£','$','%','^','&','*','(',',',')','_','-','+','=','{','[',',', ']',
                    '}', '@', '"', '/','?','.','>','\\'].indexOf(strChar) > -1;

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
            if(validationForWhat === keys.regUserOver14Profile){
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

        this.capitalizeFirstLetter = function(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        };

        this.updateUserPhotoThumbnailWhenChangingPhoto = function(newPhotoUrl){
            $('#header-wide-user-thumbnail').attr("src",'../img/user_photos/user_uploaded/' + newPhotoUrl);
            $('#header-narrow-user-thumbnail').attr("src",'../img/user_photos/user_uploaded/' + newPhotoUrl);
        };

        //Method that constructs an event date
        this.getEventDate = function(event, forUniqueEvents){
            var ret = '';
            var startTime = new Date(event.startTime);
            var endTime = new Date(event.endTime);
            //This is a weekly event
            if(event.copyOfRecurrentEvent && !forUniqueEvents){
                if(event.eventRecurrenceType === keys.eventRecurrenceTypes[0]){//Weekly event
                    ret = 'În fiecare ' + keys.daysOfWeek[startTime.getDay()] + ' ' +
                        startTime.getHours() + ':' +
                        this.adjustOneNumberMinutes(startTime.getMinutes()) + ' - ' +
                        endTime.getHours() + ':' +
                        this.adjustOneNumberMinutes(endTime.getMinutes());
                } else {
                    //For biMonthly or monthly events
                    var messageStart = 'Eveniment bilunar.';//we default to biMonthly event
                    if(event.eventRecurrenceType === keys.eventRecurrenceTypes[2]){//monthly event
                        messageStart = 'Eveniment lunar.'
                    }
                    ret = messageStart + ' Urmatoarea data este ' + this.buildUniqueEventDate(startTime, endTime);
                }
            } else {
                ret = this.buildUniqueEventDate(startTime, endTime);
            }
            return ret;
        };

        this.buildUniqueEventDate = function(startTime, endTime){
            return this.capitalizeFirstLetter(keys.daysOfWeek[startTime.getDay()]) + ' ' +  startTime.getDate() +
                ' ' + keys.months[startTime.getMonth()] + ' de la ' +
                startTime.getHours() + ':'  +
                this.adjustOneNumberMinutes(startTime.getMinutes()) + ' - ' +
                endTime.getHours() + ':'  +
                this.adjustOneNumberMinutes(endTime.getMinutes());
        };



        // This method merges all badges with users badges, by adding the number and the actual moments when the
        // user received a badge to the list of all badges, so that the users achievements can be listed on the
        // list of badges (and later in the badge view)
        this.mergeAllBadgesWithUserBadges = function(allBadges, usersBadges){
            usersBadges.forEach(function(usersBadge){
                for(var i = 0; i < allBadges.length; i++){
                    var allBadge = allBadges[i];
                    if(allBadge._id == usersBadge.typeOfBadge._id){
                        allBadge.received = usersBadge.received;
                        break;
                    }
                }
            });
            return allBadges;
        };

        //Method that constructs an event date
        this.getEventName = function(event){
            var ret = '';
            //This is a weekly event
            if(event.copyOfRecurrentEvent){
                ret = 'Evenimente săptămânale'
            } else {
                ret = event.name;
            }
            return ret;
        };

        this.handlerCommunicationErrors = function(err, methodInfo, scope, callback){
            if (err.status === 401){
                console.log('Not authorized:' + err.statusText);
                $rootScope.deleteUser(methodInfo);
                //This only happens when the mainController loads for the first time, we do not need to go to login in
                //this case
                if(scope.isFirstLoad){
                    scope.isFirstLoad = false;
                } else {
                    $location.path('/' + keys.login);
                }
            } else if (err.status === 500){
                //Display an alert notifying the user that the operation did not succeed
                if(scope){
                    scope.setAlert(keys.errorAlert, 'Probleme de comunicare cu serverul, te rugăm să mai încerci.');
                }
                console.log('Internal server error when using method (' + methodInfo + '):');
                $location.path('/' + keys.despre);
            }  else {
                console.log('Unexpected error for method (' + methodInfo + '): errData= '+ err.data + ', errStatusText=' +
                    err.statusText + ', errStatus=' + err.status + ', err=' + err);
                if(err.stack){
                    console.log(err.stack);
                }
                $location.path('/' + keys.despre);
            }
            if(callback){
                callback();
            }
            //TODO think of all possible problems and add decisions for them (like when the server does not answer because
            // of high latency)
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

        //Method for generate objectId substitute for sessions
        this.generateSessionId = function(){
            return Date.now() + '' + Math.floor((Math.random() * 10000));
        };

        this.eventIsRecurrent = function(eventType){
            return !this.eventIsUnique(eventType);
        };

        this.eventIsUnique = function(eventType){
            return eventType === keys.eventTypesUnique;
        };

        this.generateSessionId = function(){
            return Date.now() + '' + Math.floor((Math.random() * 10000000) + 1);
        };

        //Method for validating events, by adding the fields to the event itself
        this.validateEventFields = function(events){
            var hasErrors = false;
            for(var i = 0; i < events.length; i++){
                var curEvent = events[i];
                //Only check if the event is not empty (or is an unique event)
                if(!this.eventIsEmpty(curEvent) || this.eventIsUnique(curEvent.type)){
                    curEvent.error = {};
                    if(!curEvent.name || curEvent.name === ""){
                        hasErrors = true;
                        curEvent.error.name = 'Evenimentul trebuie sa aibă nume';
                    }

                    if((this.numberValueIsNullOrUndefined(curEvent.startHour) || this.numberValueIsNullOrUndefined(curEvent.startMinute))){
                        hasErrors = true;
                        curEvent.error.startTime = 'Evenimentul trebuie sa aibă oră si minut de start';
                    }

                    if((this.numberValueIsNullOrUndefined(curEvent.endHour) || this.numberValueIsNullOrUndefined(curEvent.endMinute))){
                        hasErrors = true;
                        curEvent.error.endTime = 'Evenimentul trebuie sa aibă oră si minut de sfârșit';
                    }

                    if((curEvent.startHour || curEvent.startHour === 0) && (curEvent.startMinute || curEvent.startMinute === 0) &&
                        (curEvent.endHour || curEvent.endHour === 0)  && (curEvent.endMinute || curEvent.endMinute === 0)){
                        if (curEvent.startHour > curEvent.endHour){
                            hasErrors = true;
                            curEvent.error.startTime = 'Ora de start trebuie sa fie înainte de ora de sfârșit';
                        } else if (curEvent.startHour == curEvent.endHour){
                            if(curEvent.startMinute >= curEvent.endMinute){
                                hasErrors = true;
                                curEvent.error.startTime = 'Evenimentul trebuie sa se termine dupa ce incepe';
                            }
                        }
                    }
                    //If the event is unique we need to check that the date set is today or after today
                    if(this.eventIsUnique(curEvent.type)){
                        if(curEvent.day){
                            var now = new Date();
                            var setDate = new Date(curEvent.day);
                            //If the set month is before the current month
                            if(now.getMonth() > setDate.getMonth() ||
                                    //If the months are the same but the set date is before the current date
                                ((now.getMonth() == setDate.getMonth()) && (now.getDate() > setDate.getDate()))){
                                hasErrors = true;
                                curEvent.error.day = 'Ziua evenimentului trebuie nu poate sa fie inainte de azi.';
                            } else if ((now.getMonth() == setDate.getMonth()) && (now.getDate() == setDate.getDate())){
                                //If the event is the same day as today, we need to check the hours
                                if(curEvent.endHour && curEvent.endHour < now.getHours()){
                                    hasErrors = true;
                                    curEvent.error.endTime = 'Evenimentul se termină inainte de prezent';
                                }
                            }
                        } else {
                            hasErrors = true;
                            curEvent.error.day = 'Lipseste ziua evenimentului';
                        }

                    } else {
                        //If the event is recurrent, we need to check that the eventRecurrence also has a start date set
                        if(curEvent.eventRecurrenceType != keys.eventRecurrenceTypes[0]){
                            //Event is not weekly
                            if(!curEvent.recurrenceDay || !this.isDate(curEvent.recurrenceDay)){
                                hasErrors = true;
                                curEvent.error.recurrenceDay = 'Lipseste ziua de start pentru evenimentul bilunar sau lunar.';
                            }
                        }
                    }

                    if(!curEvent.description || curEvent.description === ""){
                        hasErrors = true;
                        curEvent.error.description = 'Evenimentul trebuie sa aibă descriere';
                    }

                    for(var j = 0; j < curEvent.sessions.length; j++){
                        var curSession = curEvent.sessions[j];
                        curSession.error = {};
                        if(!curSession.workshop || curSession.workshop === ""){
                            hasErrors = true;
                            curSession.error.workshop = 'Sesiunea trebuie sa aibă atelier';
                        }

                        for(var k = 0; k < curSession.tickets.length; k++){
                            var curTicket = curSession.tickets[k];
                            if(!curTicket.nameOfTicket || curTicket.nameOfTicket === ""){
                                hasErrors = true;
                                curSession.error.ticketsError = 'Unul dintre tickete nu are nume';
                                break;
                            }

                            if(!curTicket.numOfTickets){
                                hasErrors = true;
                                curSession.error.ticketsError = 'Unul dintre tickete nu are număr, sau numărul e mai mic de 1';
                                break;
                            }
                        }
                    }
                }
            }

            return hasErrors;
        };

        this.isDate = function(dateToBeTested){
            return !isNaN(Date.parse(dateToBeTested));
        };

        // Method that compares the original event to the sanitized event, and if there are differences, add a flag
        // to indicate as such. The sanitize flag is used to inform the user which fields were sanitized, for him/her
        //to review the differences and consider if he/she wants them
        this.addSanitizedFlagToEvent = function(event, sanitEvent){
            if(event.startHour != sanitEvent.startHour){
                sanitEvent.sanitStartHour = true;
            }
            if(event.endHour != sanitEvent.endHour){
                sanitEvent.sanitEndHour = true;
            }
            if(event.startMinute != sanitEvent.startMinute){
                sanitEvent.sanitStartMinute = true;
            }
            if(event.endMinute != sanitEvent.endMinute){
                sanitEvent.sanitEndMinute = true;
            }
            if(event.name != sanitEvent.name){
                sanitEvent.sanitName = true;
            }
            if(event.description != sanitEvent.description){
                sanitEvent.sanitDescription = true;
            }
            if(event.activeStatus != sanitEvent.activeStatus){
                sanitEvent.sanitActiveStatus = true;
            }

            for(var j = 0; j < event.sessions.length; j++){
                var session = event.sessions[j];
                var sanitSession = sanitEvent.sessions[j];
                if(session.workshop != sanitSession.workshop){
                    sanitSession.sanitWorkshop = true;
                }

                for(var k = 0; k < session.tickets.length; k++){
                    var ticket = session.tickets[k];
                    var sanitTicket = sanitSession.tickets[k];
                    if(ticket.typeOfTicket != sanitTicket.typeOfTicket){
                        sanitTicket.sanitTypeOfTicket = true;
                    }
                    if(ticket.nameOfTicket != sanitTicket.nameOfTicket){
                        sanitTicket.sanitNameOfTicket = true;
                    }
                }
            }

        };

        //This is used to prepare the event for sending to the server. Sanitized flags are used to inform the user
        //that a field of the event has been sanitized by the server. Errors are used to show the user a field does
        // not respect certain constrains imposed upon the fields).
        this.removeSanitizedFlagsAndErrorsFromEvent = function(event){
            event.sanitStartHour = undefined;
            event.sanitEndHour = undefined;
            event.sanitStartMinute = undefined;
            event.sanitEndMinute = undefined;
            event.sanitDay = undefined;
            event.sanitEventReccurenceType = undefined;
            event.sanitName = undefined;
            event.sanitDescription = undefined;
            event.sanitActiveStatus = undefined;
            event.error = undefined;

            for(var i = 0; i < event.sessions.length; i++){
                var session = event.sessions[i];
                session.error = undefined;
                session.sanitWorkshop = undefined;
                for(var k = 0; k < session.tickets.length; k++){
                    var ticket = session.tickets[k];
                    ticket.sanitTypeOfTicket = undefined;
                    ticket.sanitNameOfTicket = undefined;
                }
            }
            return event;
        };

        this.eventIsEmpty = function(curEvent){
            //If any field has a value in it, then the event is not empty
            if(!(!curEvent.name || curEvent.name === "")){
                return false;
            } else if(!(this.numberValueIsNullOrUndefined(curEvent.startHour) && this.numberValueIsNullOrUndefined(curEvent.startMinute))){
                return false;
            } else if(!(this.numberValueIsNullOrUndefined(curEvent.endHour) && this.numberValueIsNullOrUndefined(curEvent.endMinute))){
                return false;
            } else if (!(!curEvent.description || curEvent.description === "")){
                return false;
            } else {
                curEvent.sessions.forEach(function(curSession){
                    if (!(!curSession.workshop || curSession.workshop === "")){
                        return false;
                    }
                    curSession.tickets.forEach(function(curTicket){
                        if(!(!curTicket.nameOfTicket || curTicket.nameOfTicket === "")){
                            return false;
                        } else if (!(!curTicket.numOfTickets)){
                            return false;
                        }
                    });
                })
            }
            return true;
        };

        //Method for adding a 0 if the minutes are just one number (eg 2 to display 02)
        this.adjustOneNumberMinutes = function(number){
            number = number + '';
            return number.length == 1 ? '0' + number : number;
        };

        this.numberValueIsNullOrUndefined  = function(number){
            if(number === undefined || number === null){
                return true;
            } else {
                return false;
            }
        };

        //Method for separating event tickets per session (list of tickets => list of sessions)
        this.convertEventTicketsToSessions = function(tickets){
            var ret = [];
            var tempRet = {};
            //This will store unique session ids
            var sessionsIds = [];

            tickets.forEach(function(ticket){
                var sessionId = ticket.sessionId;
                if(tempRet[sessionId]){
                    //If there already is a key with the session Id, we push the ticket in the tickets array
                    tempRet[sessionId].tickets.push(ticket);
                } else {
                    //If there isn't a key with the sessionId, we add a key (sessionId) - value (the session)
                    tempRet[sessionId] = {
                        workshop: ticket.workshop,
                        tickets: [ticket],
                        sessionRegUsers: [],
                        _id: sessionId

                    };
                    //We add the keys to an array for easier manipulation
                    sessionsIds.push(ticket.sessionId);
                }
            });
            //We iterate over the keys adding every session to the returning array.
            sessionsIds.forEach(function(sessionId){
                ret.push(tempRet[sessionId]);
            });

            return ret;
        };

        this.sortEventStatusDesc = function(elem1, elem2){
            //If user 1 is not confirmed and user 2 is confirmed
            if(!elem1.confirmed && elem2.confirmed){
                return -1;
            }
            //If user 1 is confirmed and user 2 is not confirmed
            else if (elem1.confirmed && !elem2.confirmed){
                return 1;
            } else {
                //If both are confirmed or both not confirmed
                return sortNameAsc(elem1, elem2);
            }
        };

        this.sortEventStatusAsc = function(elem1, elem2){
            //If user 1 is not confirmed and user 2 is confirmed
            if(!elem1.confirmed && elem2.confirmed){
                return 1;
            }
            //If user 1 is confirmed and user 2 is not confirmed
            else if (elem1.confirmed && !elem2.confirmed){
                return -1;
            } else {
                //If both are confirmed or both not confirmed
                return sortNameAsc(elem1, elem2);
            }
        };

        this.sortEventRoleDesc = function(elem1, elem2){
            var statusVal = elem1.nameOfTicket.localeCompare(elem2.nameOfTicket);
            //if elem1.role is before elem2.role we return 1
            if(statusVal < 0){
                return 1;
            }
            //if elem1.role is after elem2.role we return -1
            else if (statusVal > 0){
                return -1;
            } else {
                return sortNameAsc(elem1, elem2);
            }
        };

        this.sortEventRoleAsc = function(elem1, elem2, descending){
            var statusVal = elem1.nameOfTicket.localeCompare(elem2.nameOfTicket);
            //if elem1.role is before elem2.role we return -1
            if(statusVal < 0){
                return -1;
            }
            //if elem1.role is after elem2.role we return 1
            else if (statusVal > 0){
                return 1;
            } else {
                return sortNameAsc(elem1, elem2);
            }
        };


        var sortNameDesc = this.sortNameDesc = function(elem1, elem2){
            return sortNameAsc(elem2, elem1);
        };

        //Method for sorting names in a-z
        var sortNameAsc = this.sortNameAsc = function(elem1, elem2){
            //last name compare
            var lastNameVal = elem1.lastName.localeCompare(elem2.lastName);
            //if elem1.lastName is before elem2.lastName we return -1
            if(lastNameVal < 0){
                return -1;
            }
            //if elem1.lastName is after elem2.lastName we return 1
            else if (lastNameVal > 0){
                return 1;
            } else {
                //If the last names are the same, we do the same for the first name
                //first name compare
                var firstNameVal = elem1.firstName.localeCompare(elem2.firstName);
                //if elem1.lastName is before elem2.lastName we return -1
                if(firstNameVal < 0){
                    return -1;
                }
                //if elem1.lastName is after elem2.lastName we return 1
                else if (firstNameVal > 0){
                    return 1;
                } else {
                    //If all the names are the same, the values are equal
                    return 0;
                }
            }
        };

        //Method for sorting badge names in a-z
        this.sortBadgeNameAsc = function(elem1, elem2){
            // name compare
            var nameVal = elem1.name.localeCompare(elem2.name);
            if(nameVal < 0){
                return -1;
            }
            else if (nameVal > 0){
                return 1;
            } else {
                return 0;
            }
        };

        //Method for sorting badge names in a-z
        this.sortBadgeNameDesc = function(elem1, elem2){
            // name compare
            var nameVal = elem1.name.localeCompare(elem2.name);
            if(nameVal < 0){
                return 1;
            }
            else if (nameVal > 0){
                return -1;
            } else {
                return 0;
            }
        };

        //Method for sorting badge points from smaller to bigger
        this.sortBadgePointsAsc = function(elem1, elem2){
            // points compare
            if(elem1.points < elem2.points){
                return -1;
            }
            else if (elem1.points > elem2.points){
                return 1;
            } else {
                return 0;
            }
        };

        //Method for sorting badge names in a-z
        this.sortBadgePointsDesc = function(elem1, elem2){
            // points compare
            if(elem1.points > elem2.points){
                return -1;
            }
            else if (elem1.points < elem2.points){
                return 1;
            } else {
                return 0;
            }
        };

        this.getIndexOfElementWithIdInArray = function(listOfBadges, badge){
            var ret = -1;
            for(var i = 0; i < listOfBadges.length; i++){
                if(badge._id == listOfBadges[i]._id){
                    ret = i;
                    break;
                }
            }
            return ret;
        };

        //This method is for getting an array of users, and filtering it based on the info in the filter section.
        // It is used in many controllers.
        this.filterUsers = function(users, filteredUsers, filterType, userFilterName){
            var ret = angular.copy(users);
            if(filterType === keys.filterUsersValues.nameWritten){
                if(!userFilterName || userFilterName === ''){
                    //This is the case when the user selects the filter by name, but no name exist input yet. This also
                    //happens when the user deletes every character and we are left with an empty input
                    if((filteredUsers) && (users.length === filteredUsers.length)){
                        //This is the case where all the badges are in the filtered badges array (case when a user clicks
                        //the select by name, and no input is yet available. In this case, we can add the old filtered badges
                        ret = filteredUsers;
                    } else {
                        //This is the case where the the input has been deleted, but the last filter might have removed
                        //some badges. In this case we default to name down
                        ret.sort(this.sortNameAsc);
                    }
                } else {
                    ret =  this.filterUsersBasedOnWrittenName(users, filteredUsers, userFilterName);
                }
            }
            else if(filterType === keys.filterUsersValues.nameUp){
                ret.sort(this.sortNameAsc);
            } else if(filterType === keys.filterUsersValues.nameDown){
                ret.sort(this.sortNameDesc);
            }
            return ret;
        };

        //This is a method that returns an array with filtered users based on a word entered in an input field.
        this.filterUsersBasedOnWrittenName = function(users, filteredUsers, userFilterName){
            var ret = [];

            if(userFilterName && userFilterName !== ''){
                var splitFilteredInput = userFilterName.split(' ');
                users.forEach(function(user){
                    var numberOfNecessaryMatches = splitFilteredInput.length;
                    var matches = 0;
                    for(var i = 0; i < splitFilteredInput.length; i++){
                        var inputWord = addDiacriticsToSearch(splitFilteredInput[i]);
                        var regExInput = new RegExp(inputWord, 'i');
                        if(user.firstName.match(regExInput)){
                            matches++;
                        } else if (user.lastName.match(regExInput)){
                            matches++;
                        } else if(user.alias && user.alias.match(regExInput)){
                            matches++;
                        } else if(user.email && user.email.match(regExInput)){
                            matches++;
                        }
                    }
                    if(matches === numberOfNecessaryMatches){
                        ret.push(user);
                    }
                });
            } else {
                //if no user filter name exists yet
                //We check if the filtered by username is triggered while the filtered list has all de users, and if that
                // is true (and since there is no filter name input yet) we return the filtered list. If the lists differ
                // in size, we return the original users list, sorted alphabetically
                if(filteredUsers.length == users.length){
                    ret = filteredUsers;
                }
                else {
                    ret = users;
                }
            }
            ret.sort(this.sortNameAsc);
            return ret;
        };


        this.getBackgroundUrlForSpecialEventPhoto = function(specialEvent){
            if(specialEvent.photo){
                return 'background-image:url(\'../img/special_events/user_uploaded/' + specialEvent.photo + '\')';
            } else {
                return 'background-image:url(\'../img/special_events/special_event_default_photo.jpg\')'
            }
        }

    })
    .service('dojosService', function(){
    });