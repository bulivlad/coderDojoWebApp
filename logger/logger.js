const timestamp = () => (new Date()).toLocaleString();
//const formatter = (options) => options.timestamp() +' '+ options.level.toUpperCase() +' '+ (options.message ? options.message : '') +
//    (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );;

const winston = require('winston');
require('winston-daily-rotate-file');


winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    timestamp: timestamp,
    //formatter: formatter,
    colorize: true,
});

let monthlyTransport = {
        filename: './logger/logFiles/log',
        prepend: true,
        timestamp: timestamp
};


winston.add(winston.transports.DailyRotateFile, monthlyTransport);

winston.level = process.env.ENV === 'development' ? 'debug' : 'info'; //{ error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
module.exports = winston;

