/**
 * Created by Adina Paraschiv on 3/25/2017.
 */

let validatorsAndFormatters = {};

validatorsAndFormatters.errorFormatter = function(param, msg, value){
    let namespace = param.split("."),
        root = namespace.shift(),
        formParam = root;

    while(namespace.length){
        formParam += "[" + namespace.shift() + "]";
    }
    return {
        param: formParam,
        msg: msg,
        value: value
    };
};

validatorsAndFormatters.customValidators = {
    isAgeGreaterThen14: function(birthDateRaw){
        return compareAge(birthDateRaw, 14, 'older');
    },
    isAgeLessThen14: function(birthDateRaw){
        return compareAge(birthDateRaw, 14, 'younger');
    },
    isAgeBetween14and18: function(birthDateRaw){
        return (compareAge(birthDateRaw, 14, 'older') && //Older than 14
        compareAge(birthDateRaw, 18, 'younger')); //Younger than 18
    },
    isAgeGreaterThen18: function(birthDateRaw){
        return compareAge(birthDateRaw, 18, 'older');
    },
    isPasswordValid: function(password){
        var ret = false;
        if ((password.length >= 8) && //Pasword contains at least 8 characters
            password.match(/[a-z]+/g) && //Password contains at least one small letter
            password.match(/[A-Z]+/g) && //Password contains at least one capital letter
            password.match(/[0-9]+/g)){ //Password contains at least one number

            ret = true;
        }
        return ret;
    },
    isAliasValid: function(alias){
        var containsAcceptedCharacters = alias.match(/[A-Za-z0-9]+/g);
        var doesNotContainUnacceptedCharacters =  !alias.match(/[^A-Za-z0-9]+/g)
        return (containsAcceptedCharacters && doesNotContainUnacceptedCharacters);
    }
};




//Method that determines if a user's age is less or more than an value provided (ageOffset).
function compareAge(birthDateRaw, ageOffset, lessOrMore){
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


module.exports = validatorsAndFormatters;
