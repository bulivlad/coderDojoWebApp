const fs = require('fs');
const winston = require('winston');
require('winston-daily-rotate-file');

const timestamp = () => (new Date()).toLocaleString();

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    timestamp: timestamp,
    //formatter: formatter,
    colorize: true,
});

//Creating the logFiles directory if it does not exist

var dir = './logger/logFiles';

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

let monthlyTransport = {
        filename: './logger/logFiles/log',
        prepend: true,
        timestamp: timestamp
};


winston.add(winston.transports.DailyRotateFile, monthlyTransport);

winston.level = process.env.ENV === 'development' ? 'silly' : 'info'; //{ error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
module.exports = winston;

