
const validator = require('validator');
const keys = require('./static_keys/project_keys')


//This method receives an hour, minutes and day, and returns a date when the event will occur next (less then a week)
function getNextEventTimes(startHour, startMinute, endHour, endMinute, day){
    let now = new Date();
    let ret = {};
    let daysToAdd = getNumberOfDaysToAdd(now, keys.daysOfWeek.indexOf(day), startHour, startMinute);

    let startDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    startDate.setHours(startHour);
    startDate.setMinutes(startMinute);
    startDate.setSeconds(0);
    ret.startDate = startDate;

    let endDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    endDate.setHours(endHour);
    endDate.setMinutes(endMinute);
    endDate.setSeconds(0);
    ret.endDate = endDate;

    return ret;

}

function getNumberOfDaysToAdd(dateNow, indexOfSelectedDay, startHours, startMinutes){
    let indexOfNow = dateNow.getDay();
    console.log('indexOfNow:', indexOfNow);
    console.log('indexOfSelectedDay:', indexOfSelectedDay);
    if(indexOfSelectedDay > indexOfNow){
        return indexOfSelectedDay - indexOfNow;
    } else if(indexOfSelectedDay == indexOfNow){
        //If they are on the same day, we check if the potential date is later than right now (case which days to add is 0)
        // if it is earlier, then the potential date has to be next week (case where we add 7);
        let startTimeOfEvent = new Date();
        startTimeOfEvent.setHours(startHours);
        startTimeOfEvent.setMinutes(startMinutes);
        //If the start time is later than now, we can start on the same day
        if(startTimeOfEvent > dateNow){
            return 0;
        } else {
            return 7;
        }
    }else {
        let daysToAdd = 0;
        while(indexOfNow != indexOfSelectedDay){
            indexOfNow++;
            if(indexOfNow === 7){
                indexOfNow = 0;
            }
            daysToAdd++;
        }
        return daysToAdd;
    }
}


let startEndTime = getNextEventTimes(10, 0, 17, 0, 'Duminică');

console.log(`From: ${startEndTime.startDate}, to:${startEndTime.endDate}`)